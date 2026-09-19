import { Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

export interface ILazyLoadParams {
  sortField?: string | string[] | null;
  sortOrder?: 1 | -1 | 0;
  filters?: Record<string, any>;
  first?: number;
  rows?: number | null;
  globalFilter?: string | string[] | null;
}

export interface ILazyLoadResult<T> {
  data: T[];
  total: number;
}

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
    console.log('getData params = ', params);

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

    // 3. Сортировка (single или multiple)
    const sortFields = this.normalizeSortFields(params.sortField);
    if (sortFields.length && params.sortOrder) {
      result = this.applySort(result, sortFields, params.sortOrder);
    }

    // 4. Общее количество до пагинации
    const total = result.length;

    // 5. Пагинация
    const first = params.first ?? 0;
    const rows = params.rows ?? total;
    result = result.slice(first, first + rows);

    return of({ data: result, total }).pipe(delay(300));
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
   * Приведение sortField к массиву (поддержка multi-sort).
   * @param value - значения поля для сортировки
   */
  private normalizeSortFields(value: string | string[] | null | undefined): string[] {
    if (value == null) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr.filter((v) => v != null && v !== '');
  }

  /**
   * Сортировка по одному или нескольким полям.
   * Для multi-sort все поля сортируются в одном направлении (как делает Optimus
   * при клике по заголовку без мета-информации).
   */
  private applySort<T extends Record<string, any>>(
    data: T[],
    fields: string[],
    order: 1 | -1 | 0,
  ): T[] {
    if (order === 0) return data;

    return [...data].sort((a, b) => {
      for (const field of fields) {
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
   */
  private applyFilters<T extends Record<string, any>>(
    data: T[],
    filters: Record<string, any>,
  ): T[] {
    let result = data;

    for (const field of Object.keys(filters)) {
      const filter = filters[field];
      const value = filter?.value;
      const matchMode = filter?.matchMode ?? 'contains';

      if (value == null || value === '') continue;

      result = result.filter((row) => {
        const cell = row[field];
        return this.match(cell, value, matchMode);
      });
    }

    return result;
  }

  /**
   * Логика сопоставления для matchMode.
   */
  private match(cell: any, value: any, matchMode: string): boolean {
    if (cell == null) return false;

    const c = String(cell).toLowerCase();
    const v = String(value).toLowerCase();

    switch (matchMode) {
      case 'startsWith':
        return c.startsWith(v);
      case 'endsWith':
        return c.endsWith(v);
      case 'equals':
        return c === v;
      case 'notEquals':
        return c !== v;
      case 'in':
        return Array.isArray(value) ? value.map((x) => String(x).toLowerCase()).includes(c) : false;
      case 'contains':
      default:
        return c.includes(v);
    }
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
