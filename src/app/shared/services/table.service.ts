import { Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import {
  IColumn,
  IColumnFilterMeta,
  ILazyLoadParams,
  ILazyLoadResult,
  IPossibleValue,
  ISortMeta,
} from '../constants';
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
            String(this.getValueForFiltering(v) ?? '')
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
   * Получение данных для фильтрации из значения ячейки таблицы
   * @param valueCell - значение данных в ячейке таблицы
   */
  private getValueForFiltering(valueCell: any) {
    if (typeof valueCell === 'object') {
      const optionLabel = Object.keys(valueCell).find((item) => item !== 'id') ?? 'id';
      return valueCell[optionLabel];
    } else {
      return valueCell;
    }
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
      for (const { field, order, type } of meta) {
        const cmp = this.compareValues(a[field], b[field], type);
        if (cmp !== 0) return cmp * order;
      }
      return 0;
    });
  }

  /**
   * Сравнение двух значений с учётом типа колонки.
   * Возвращает <0, 0, >0 — совместимо с Array.prototype.sort.
   * @param a - первое значение
   * @param b - второе значение
   * @param type - тип колонки
   */
  private compareValues(a: any, b: any, type?: string): number {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    switch (type) {
      case 'date':
        return this.compareDates(a, b, false);
      case 'datetime':
        return this.compareDates(a, b, true);
      case 'number':
        return this.compareNumbers(a, b);
      case 'boolean':
        return Number(Boolean(a)) - Number(Boolean(b));
      case 'object':
      case 'object[]':
        return this.compareObjects(a, b);
      case 'string':
        return this.compareStrings(a, b);
      default:
        // Без type — «старое» поведение: определяем по значению
        return this.compareFallback(a, b);
    }
  }

  /**
   * Сравнение строк (локаль ru)
   * @param a - первое значение
   * @param b - второе значение
   */
  private compareStrings(a: any, b: any): number {
    return String(a).localeCompare(String(b), 'ru');
  }

  /**
   * Сравнение чисел
   * @param a - первое значение
   * @param b - второе значение
   */
  private compareNumbers(a: any, b: any): number {
    const na = Number(a);
    const nb = Number(b);

    const aNaN = Number.isNaN(na);
    const bNaN = Number.isNaN(nb);

    if (aNaN && bNaN) return 0;
    if (aNaN) return 1; // NaN — в конец
    if (bNaN) return -1;
    return na - nb;
  }

  /**
   * Сравнение дат
   * @param a - первое значение
   * @param b - второе значение
   * @param withTime - true для datetime (по моменту времени), false для date (по дню)
   */
  private compareDates(a: any, b: any, withTime: boolean): number {
    const da = this.toDate(a, withTime);
    const db = this.toDate(b, withTime);

    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;

    return withTime ? da.getTime() - db.getTime() : this.dayDiff(da, db);
  }

  /**
   * Сравнение object / object[] по текстовому полю.
   * Для массива берём первую метку — этого достаточно для стабильной сортировки.
   * @param a - первое значение
   * @param b - второе значение
   */
  private compareObjects(a: any, b: any): number {
    const la = this.extractObjectLabels(a, 'name')[0] ?? '';
    const lb = this.extractObjectLabels(b, 'name')[0] ?? '';
    return la.localeCompare(lb, 'ru');
  }

  /**
   * Fallback для сортировки без type.
   * Определяет тип значения «на лету» — как делал старый normalize.
   * @param a - первое значение
   * @param b - второе значение
   */
  private compareFallback(a: any, b: any): number {
    const va = this.normalize(a);
    const vb = this.normalize(b);

    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;

    if (typeof va === 'number' && typeof vb === 'number') return va - vb;
    if (va instanceof Date && vb instanceof Date) return va.getTime() - vb.getTime();
    return String(va).localeCompare(String(vb), 'ru');
  }

  /**
   * Применение фильтров
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

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   */
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

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   */
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

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   */
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

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   * @param withTime - признак учёта времени
   */
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

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param cell - значение в ячейке таблицы
   * @param value - значение, указанное в фильтре
   * @param matchMode - правило сравнения
   * @param optionLabel - ключ текстового поля объекта
   */
  private matchObject(cell: any, value: any, matchMode: string, optionLabel = 'name'): boolean {
    const labels = this.extractObjectLabels(cell, optionLabel);
    if (labels.length === 0) return false;

    return labels.some((label) => this.matchString(label, value, matchMode));
  }

  /**
   * Формирование массива строковых переменных для фильтрации
   * @param cell - значение в ячейке таблицы
   * @param optionLabel - ключ текстового поля объекта
   * @private
   */
  private extractObjectLabels(cell: any, optionLabel: string): string[] {
    if (cell == null) return [];
    if (Array.isArray(cell)) {
      return cell.flatMap((item) => this.extractObjectLabels(item, optionLabel));
    }
    if (typeof cell === 'object') {
      const label = cell[optionLabel] ?? cell.name ?? cell.id;
      return label != null ? [String(label)] : [];
    }
    return [String(cell)];
  }

  /**
   * Проверка удовлетворения выполнения фильтрации
   * @param v - значение в ячейке таблицы
   * @param withTime - признак учёта времени
   */
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

  /**
   * Расчёт разницы в датах в днях
   * @param a - значение 1 даты
   * @param b - значение 2 даты
   * @private
   */
  private dayDiff(a: Date, b: Date): number {
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return da - db;
  }

  /**
   * Приведение значений к сравнимому виду.
   */
  private normalize(value: unknown): string | number | Date | null {
    if (value == null) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;

    if (typeof value === 'object') {
      const label = (value as any).name ?? (value as any).id;
      return label != null ? String(label) : null;
    }

    if (typeof value === 'string') {
      const s = value.trim();
      if (!s) return null;

      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const t = Date.parse(s);
        if (!isNaN(t)) return new Date(t);
      }

      if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) {
        const hasTime = /\d{2}:\d{2}/.test(s);
        const format = hasTime ? 'DD.MM.YYYY HH:mm:ss' : 'DD.MM.YYYY';
        return stringToDate(s, format);
      }

      return s;
    }

    return String(value);
  }

  /**
   * Имитация серверного запроса за уникальными значениями колонки.
   * Учитывает переданные фильтры (кроме фильтра по самой колонке) и глобальный поиск.
   * @param source - исходный массив данных таблицы
   * @param options - параметры запроса
   * @param options.column - колонка, по которой собираются уникальные значения
   * @param options.filters - активные фильтры (без фильтра по column.field)
   * @param options.globalFilter - значение глобального поиска
   */
  getPossibleValues<T extends Record<string, any>>(
    source: T[],
    options: {
      column: IColumn;
      filters: Record<string, IColumnFilterMeta>;
      globalFilter: string | null;
    },
  ): Observable<IPossibleValue[]> {
    if (!source || source.length === 0) {
      // return of([]).pipe(delay(300));
      return of([]);
    }

    const { column } = options;
    let result = [...source];

    // 1. Глобальный поиск
    const globalFilter = this.normalizeGlobalFilter(options.globalFilter);
    if (globalFilter.length) {
      result = result.filter((row) =>
        globalFilter.some((q) =>
          Object.values(row).some((v) =>
            String(this.getValueForFiltering(v) ?? '')
              .toLowerCase()
              .includes(q),
          ),
        ),
      );
    }

    // 2. Фильтры по другим колонкам
    if (options.filters && Object.keys(options.filters).length) {
      result = this.applyFilters(result, options.filters);
    }

    // 3. Сбор уникальных значений по полю
    const map = new Map<string, IPossibleValue>();
    for (const row of result) {
      const raw = row[column.field];
      if (raw === null || raw === undefined) continue;

      const values = Array.isArray(raw) ? raw : [raw];
      for (const v of values) {
        const key = this.getPossibleValueKey(v, column);
        if (key === null) continue;
        if (map.has(key)) continue;

        map.set(key, this.toPossibleValue(v, column));
      }
    }

    // 4. Сортировка по алфавиту
    const sorted = [...map.values()].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'ru'),
    );

    // return of(sorted).pipe(delay(300));
    return of(sorted);
  }

  /**
   * Ключ уникальности значения для дедупликации в Map.
   * @param value - значение ячейки
   * @param column - колонка (нужна для optionValue)
   */
  private getPossibleValueKey(value: any, column: IColumn): string | null {
    if (value === null || value === undefined) return null;

    if (typeof value === 'object') {
      const valueField = column.optionValue ?? this.detectValueField(value);
      const id = value[valueField];
      return id != null ? `${typeof id}:${id}` : null;
    }
    return `${typeof value}:${value}`;
  }

  /**
   * Преобразование значения ячейки в IPossibleValue.
   * @param value - значение ячейки
   * @param column - колонка (нужна для optionLabel / optionValue)
   */
  private toPossibleValue(value: any, column: IColumn): IPossibleValue {
    if (value !== null && typeof value === 'object') {
      const labelField = column.optionLabel ?? this.detectLabelField(value);
      const valueField = column.optionValue ?? this.detectValueField(value);

      const label = value[labelField] ?? value.name ?? value.id ?? '';
      const val = value[valueField] ?? value.id ?? value.name;

      return { name: String(label), value: val, selected: false };
    }

    return { name: String(value), value, selected: false };
  }

  /**
   * Эвристика для определения текстового поля объекта, если optionLabel не задан.
   */
  private detectLabelField(value: any): string {
    return ['name', 'label', 'title', 'caption'].find((k) => k in value) ?? 'id';
  }

  /**
   * Эвристика для определения поля-значения объекта, если optionValue не задан.
   */
  private detectValueField(value: any): string {
    return ['id', 'value', 'code', 'key'].find((k) => k in value) ?? 'name';
  }
}
