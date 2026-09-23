import { Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { IColumnFilterMeta, ILazyLoadParams, ILazyLoadResult, ISortMeta } from '../constants';
import { stringToDate } from '../utils';

@Service()
export class TableService {
  /**
   * Имитация серверного запроса с сортировкой, фильтрацией и пагинацией.
   * @param source - исходный массив данных таблицы
   * @param params - параметры lazy-загрузки от Optimus
   */
  getData<T extends Record<string, any>>(
    source: T[],
    params: ILazyLoadParams,
  ): Observable<ILazyLoadResult<T>> {
    if (!source || source.length === 0) {
      return of({ data: [], total: 0 }).pipe(delay(300));
    }

    let result = [...source];

    // 1. Глобальный поиск
    const globalFilter = this.normalizeGlobalFilter(params.globalFilter);
    if (globalFilter.length) {
      result = result.filter((row) =>
        globalFilter.some((q) =>
          Object.values(row).some((v) =>
            String(v ?? '')
              .toLowerCase()
              .includes(q),
          ),
        ),
      );
    }

    // 2. Фильтры по колонкам
    if (params.filters) {
      result = this.applyFilters(result, params.filters);
    }

    // 3. Мультисортировка
    if (params.multiSortMeta?.length) {
      result = this.applyMultiSort(result, params.multiSortMeta);
    }

    // 4. Общее количество до пагинации
    const total = result.length;

    // 5. Пагинация
    const first = params.first ?? 0;
    const rows = params.rows ?? total;
    result = result.slice(first, first + rows);

    return of({ data: result, total });
  }

  /**
   * Приведение глобального фильтра к массиву строк в нижнем регистре.
   * @param value - значения глобального фильтра
   */
  private normalizeGlobalFilter(value?: string | string[] | null): string[] {
    if (value == null) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr.filter((v) => v != null && v !== '').map((v) => String(v).toLowerCase());
  }

  /**
   * Мультисортировка по массиву критериев.
   * Критерии применяются последовательно: если по первому поля значения равны,
   * сравниваются по второму, и так далее. Направление у каждого критерия своё.
   * @param data - массив исходных данных
   * @param meta - выбранные правила сортировки
   */
  private applyMultiSort<T extends Record<string, any>>(data: T[], meta: ISortMeta[]): T[] {
    if (!meta.length) return data;

    return [...data].sort((a, b) => {
      for (const { field, order } of meta) {
        const va = this.normalize(a[field]);
        const vb = this.normalize(b[field]);

        if (va == null && vb == null) continue;
        if (va == null) return 1;
        if (vb == null) return -1;

        let cmp = 0;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb, 'ru');
        } else if (va instanceof Date && vb instanceof Date) {
          cmp = va.getTime() - vb.getTime();
        } else if (typeof va === 'number' && typeof vb === 'number') {
          cmp = va - vb;
        } else {
          cmp = String(va).localeCompare(String(vb), 'ru');
        }

        if (cmp !== 0) return cmp * order;
      }
      return 0;
    });
  }

  /**
   * Применение фильтров PrimeNG.
   * Структура: { field: { value, matchMode } }
   * @param data - массив исходных данных
   * @param filters - установленные фильтры
   */
  private applyFilters<T extends Record<string, any>>(
    data: T[],
    filters: Record<string, IColumnFilterMeta>,
  ): T[] {
    let result = data;

    for (const field of Object.keys(filters)) {
      const raw = filters[field];
      if (raw == null) continue;

      // PrimeNG может прислать как одиночный FilterMetadata,
      // так и массив FilterMetadata[] (мультифильтр по одному полю)
      const metas: any[] = Array.isArray(raw) ? raw : [raw];
      if (metas.length === 0) continue;

      // operator верхнего уровня: если хоть один 'or' — используем ИЛИ,
      // иначе (все 'and' или не задан) — И
      const operator = metas[0]?.operator ?? 'and';
      const useOr = operator === 'or';

      result = result.filter((row) => {
        const cell = row[field];

        const checks = metas.map((meta) => {
          const value = meta?.value;
          const matchMode = meta?.matchMode ?? 'contains';
          const type = meta?.type;

          // пустые условия игнорируем
          if (value == null || value === '') return null;
          if (Array.isArray(value) && value.length === 0) return null;

          return this.match(cell, value, matchMode, type);
        });

        const active = checks.filter((c): c is boolean => c !== null);
        if (active.length === 0) return true;
        return useOr ? active.some(Boolean) : active.every(Boolean);
      });
    }

    return result;
  }

  /**
   * Логика сопоставления для matchMode.
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   * @param type - тип колонки (date, datetime, number, string, ...)
   */
  private match(cell: any, value: any, matchMode: string, type?: string): boolean {
    if (cell == null) return value == null; // null == null → true

    switch (type) {
      case 'date':
        return this.matchDate(cell, value, matchMode, false);
      case 'datetime':
        return this.matchDate(cell, value, matchMode, true);
      case 'number':
        return this.matchNumber(cell, value, matchMode);
      case 'boolean':
        return this.matchBoolean(cell, value, matchMode);
      case 'object':
      case 'object[]':
        return this.matchObject(cell, value, matchMode);
      case 'string':
        return this.matchString(cell, value, matchMode);
      default:
        console.warn(
          `[TableService] Фильтр без type или с неизвестным type="${type}", ` +
            `matchMode="${matchMode}", field пропущен.`,
        );
        return false;
    }
  }

  private matchString(cell: any, value: any, matchMode: string): boolean {
    const c = String(cell).toLowerCase();
    const v = String(value).toLowerCase();

    switch (matchMode) {
      case 'contains':
        return c.includes(v);
      case 'notContains':
        return !c.includes(v);
      case 'startsWith':
        return c.startsWith(v);
      case 'endsWith':
        return c.endsWith(v);
      case 'equals':
        return c === v;
      case 'notEquals':
        return c !== v;
      case 'in':
        return Array.isArray(value) && value.some((x) => String(x).toLowerCase() === c);
      default:
        return false;
    }
  }

  private matchNumber(cell: any, value: any, matchMode: string): boolean {
    const c = Number(cell);
    if (Number.isNaN(c)) return false;

    const toNum = (x: any) => {
      if (x === null || x === undefined || x === '') return null;
      const n = Number(x);
      return Number.isNaN(n) ? null : n;
    };

    switch (matchMode) {
      case 'equals': {
        const v = toNum(value);
        return v != null && c === v;
      }
      case 'notEquals': {
        const v = toNum(value);
        return v == null || c !== v;
      }
      case 'lt': {
        const v = toNum(value);
        return v != null && c < v;
      }
      case 'lte': {
        const v = toNum(value);
        return v != null && c <= v;
      }
      case 'gt': {
        const v = toNum(value);
        return v != null && c > v;
      }
      case 'gte': {
        const v = toNum(value);
        return v != null && c >= v;
      }
      case 'in':
        return Array.isArray(value) && value.some((x) => toNum(x) === c);
      case 'between': {
        if (!Array.isArray(value) || value.length !== 2) return false;

        const lo = toNum(value[0]);
        const hi = toNum(value[1]);

        if (lo == null && hi == null) return true;
        if (lo == null) return c <= hi!;
        if (hi == null) return c >= lo;
        return c >= lo && c <= hi;
      }
      default:
        return false;
    }
  }

  private matchBoolean(cell: any, value: any, matchMode: string): boolean {
    const c = Boolean(cell);
    switch (matchMode) {
      case 'equals':
        return c === Boolean(value);
      case 'notEquals':
        return c !== Boolean(value);
      case 'in':
        return Array.isArray(value) && value.some((x) => Boolean(x) === c);
      default:
        return false;
    }
  }

  private matchDate(cell: any, value: any, matchMode: string, withTime: boolean): boolean {
    const c = this.toDate(cell, withTime);
    if (c === null) return false;

    const cmp = (a: Date, b: Date) => (withTime ? a.getTime() - b.getTime() : this.dayDiff(a, b));

    switch (matchMode) {
      case 'equals': {
        const v = this.toDate(value, withTime);
        return !!v && cmp(c, v) === 0;
      }
      case 'notEquals': {
        const v = this.toDate(value, withTime);
        return !v || cmp(c, v) !== 0;
      }
      case 'lt':
      case 'lte':
      case 'gt':
      case 'gte': {
        const v = this.toDate(value, withTime);
        if (!v) return false;
        const d = cmp(c, v);
        switch (matchMode) {
          case 'lt':
            return d < 0;
          case 'lte':
            return d <= 0;
          case 'gt':
            return d > 0;
          case 'gte':
            return d >= 0;
        }
        return false;
      }
      case 'between': {
        if (!Array.isArray(value) || value.length !== 2) return false;

        const lo = this.toDate(value[0], withTime);
        const hi = this.toDate(value[1], withTime);

        if (lo === null && hi === null) return true;

        if (lo === null) return hi !== null && cmp(c, hi) <= 0;
        if (hi === null) return cmp(c, lo) >= 0;
        return cmp(c, lo) >= 0 && cmp(c, hi) <= 0;
      }
      case 'in': {
        if (!Array.isArray(value)) return false;
        return value.some((x) => {
          const v = this.toDate(x, withTime);
          return !!v && cmp(c, v) === 0;
        });
      }
      default:
        return false;
    }
  }

  private matchObject(cell: any, value: any, matchMode: string): boolean {
    // Единый формат: массив идентификаторов
    if (Array.isArray(value)) {
      const cellId = this.extractId(cell);
      return value.some((v) => this.compareEq(cellId, this.extractId(v)));
    }
    // Объект { поле: значение }
    if (value && typeof value === 'object') {
      return Object.keys(value).every((k) => this.compareEq(cell?.[k], value[k]));
    }
    return this.compareEq(this.extractId(cell), value);
  }

  private toDate(v: any, withTime: boolean): Date | null {
    if (v == null) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;

      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const t = Date.parse(s);
        return isNaN(t) ? null : new Date(t);
      }
      if (!/^\d{2}\.\d{2}\.\d{4}/.test(s)) return null;

      const hasTime = /\d{2}:\d{2}/.test(s);
      const format = withTime || hasTime ? 'DD.MM.YYYY HH:mm:ss' : 'DD.MM.YYYY';
      return stringToDate(s, format);
    }
    return null;
  }

  private dayDiff(a: Date, b: Date): number {
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return da - db;
  }

  /** Достаём id из объекта (если пришёл объект) или возвращаем как есть
   * @param v - значение переменной
   */
  private extractId(v: any): any {
    if (v && typeof v === 'object' && 'id' in v) return (v as any).id;
    if (v && typeof v === 'object' && 'value' in v) return (v as any).value;
    return v;
  }

  /** Проверка на равенство с учётом чисел и дат
   * @param a - исходное значение данных
   * @param b - заданное значение фильтра
   */
  private compareEq(a: any, b: any): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    if (typeof a === 'number' || typeof b === 'number') {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na === nb;
    }

    return String(a).toLowerCase() === String(b).toLowerCase();
  }

  /**
   * Приведение значений к сравнимому виду.
   */
  private normalize(value: unknown): string | number | Date | null {
    if (value == null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const asDate = Date.parse(value);
      if (!isNaN(asDate) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    }
    return String(value);
  }
}
