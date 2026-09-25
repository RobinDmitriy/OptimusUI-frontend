import {
  Component,
  computed,
  effect,
  inject,
  input,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Table, TableLazyLoadEvent, TableModule } from '@openng/optimus-ui/table';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { Card } from '@openng/optimus-ui/card';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { IconField } from '@openng/optimus-ui/iconfield';
import { InputIcon } from '@openng/optimus-ui/inputicon';
import { FormsModule } from '@angular/forms';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Button } from '@openng/optimus-ui/button';
import { ContextMenu } from '@openng/optimus-ui/contextmenu';
import { MenuItem } from '@openng/optimus-ui/api';
import { TableService } from '../../services';
import {
  IColumn,
  IColumnFilterMeta,
  IFilterValue,
  IPossibleValue,
  ISortMeta,
} from '../../constants';
import { OverlayBadge } from '@openng/optimus-ui/overlaybadge';
import { TableRowFilter } from './table-row-filter/table-row-filter';
import { TableHeaderColumnFilter } from './table-header-column-filter/table-header-column-filter';
import { HeaderColumnFilterButton } from './header-column-filter-button/header-column-filter-button';

interface IFetchOptions {
  first?: number;
  rows?: number;
  globalFilter?: string | null;
}

@Component({
  imports: [
    TableModule,
    DatePipe,
    Card,
    Toolbar,
    IconField,
    InputIcon,
    FormsModule,
    InputText,
    Button,
    ContextMenu,
    NgTemplateOutlet,
    OverlayBadge,
    TableRowFilter,
    TableHeaderColumnFilter,
    HeaderColumnFilterButton,
    NgClass,
  ],
  selector: 'app-custom-table',
  styleUrl: './custom-table.css',
  templateUrl: './custom-table.html',
})
export class CustomTable {
  @ViewChild('dt') dt!: Table;
  @ViewChildren(HeaderColumnFilterButton) filterButtons!: QueryList<HeaderColumnFilterButton>;
  @ViewChild('cm') cm!: ContextMenu;

  columns = input<IColumn[] | undefined>(undefined);
  data = input<any[]>([]);

  dataKey = input<string>('id');
  showPanelInput = input<boolean>(true);
  showToolbar = input<boolean>(true);
  title = input<string>('');
  showContentFilter = input<boolean>(true);
  isSortedInput = input<boolean>(true);
  sortMode = input<'single' | 'multiple'>('single');
  showRowFilters = input<boolean>(true);
  showColumnFilter = input<boolean>(true);
  showClearAllFilterButton = input<boolean>(true);
  showPaginator = input<boolean>(true);

  value: any;
  searchValue = signal<string | null>(null);
  totalRecords = signal(0);
  loading = signal(false);

  activeFilterField = signal<string | null>(null);
  filters = signal<Record<string, IColumnFilterMeta[]>>({});
  // multiFilterColumn = new Map<string, FilterMetadata | null>();
  // multiFilterColumn = signal<Record<string, IColumnFilterMeta>>({});
  resetFilters = signal<boolean>(false);

  possibleValues = signal<Record<string, IPossibleValue[]>>({});
  possibleLoading = signal<Record<string, boolean>>({});

  multiSortMeta = signal<ISortMeta[]>([]);

  showPanel = computed(() => this.showPanelInput() && this.data().length > 0);
  isSorted = computed(() => this.isSortedInput());
  isNotFilters = computed(() => this.searchValue() === null && !this.hasFilters());
  hasFilters = computed(() => {
    const filters = this.filters();
    return Object.values(filters).some((m) => this.isFilterFilled(m));
  });
  selectedFilterValues = computed<Record<string, any[]>>(() => {
    const filters = this.filters();
    const map: Record<string, any[]> = {};
    for (const [field, metas] of Object.entries(filters)) {
      const header = metas.find((m) => m.source === 'header');
      if (!header?.value) continue;
      if (header.matchMode !== 'in') continue;
      map[field] = Array.isArray(header.value) ? header.value : [header.value];
    }
    return map;
  });
  hasRowFilter = computed<Record<string, boolean>>(() => {
    const filters = this.filters();
    const map: Record<string, boolean> = {};
    for (const [field, metas] of Object.entries(filters)) {
      if (metas.some((m) => m.source === 'row' && this.isFilterFilled(m))) {
        map[field] = true;
      }
    }
    return map;
  });

  private possibleCache = new Map<string, IPossibleValue[]>();
  private tableService = inject(TableService);

  constructor() {
    this.initValue();
  }

  // ***********************************************************************************************
  // ******************************* Функции для сортировки данных *********************************
  // ***********************************************************************************************
  /**
   * Направление сортировки для заданного столбца (0 — не участвует).
   * @param field - код столбца таблицы
   */
  sortOrderFor = (field: string): 1 | -1 | 0 => {
    const meta = this.multiSortMeta().find((m) => m.field === field);
    return meta?.order ?? 0;
  };

  /**
   * Индекс столбца в мультисортировке (для отображения приоритета).
   * -1 — не участвует.
   * @param field - код столбца таблицы
   */
  sortIndexFor = (field: string): number => {
    return this.multiSortMeta().findIndex((m) => m.field === field);
  };

  /**
   * Обработка события при нажатии на заголовок таблицы
   * @param column - данные заголовка
   * @param event - данные события мыши
   */
  onHeaderClick(column: IColumn, event: MouseEvent) {
    if (!this.isSorted()) return;

    const currentMeta = [...this.multiSortMeta()];
    const existingIndex = currentMeta.findIndex((m) => m.field === column.field);

    if (event.ctrlKey) {
      // Shift + клик — мультисортировка
      if (existingIndex === -1) {
        currentMeta.push({ field: column.field, order: 1, type: column.type });
      } else {
        // Цикл для существующего: 1 → -1 → удалить
        const currentOrder = currentMeta[existingIndex].order;
        if (currentOrder === 1) {
          currentMeta[existingIndex] = {
            ...currentMeta[existingIndex],
            order: -1,
            type: column.type,
          };
        } else {
          currentMeta.splice(existingIndex, 1);
        }
      }
    } else {
      // Обычный клик — сбрасываем всё, оставляем только этот столбец
      if (existingIndex !== -1 && currentMeta.length === 1) {
        // Клик по единственному столбцу — цикл 1 → -1 → 0
        const currentOrder = currentMeta[existingIndex].order;
        if (currentOrder === 1) {
          currentMeta[0] = { field: column.field, order: -1, type: column.type };
        } else {
          currentMeta.length = 0; // сброс
        }
      } else {
        // Новый столбец или клик по одному из многих — заменяем всё
        currentMeta.length = 0;
        currentMeta.push({ field: column.field, order: 1, type: column.type });
      }
    }

    this.multiSortMeta.set(currentMeta);

    // Сброс на первую страницу
    this.fetch({
      first: 0,
      rows: this.dt?.rows ?? 10,
      globalFilter: this.searchValue() ?? null,
    });
  }

  /**
   * Установка фильтрации данных по введённому значению в поле поиска
   * @param event - данные события ввода данных
   */
  setFilterSearch(event: any) {
    this.searchValue.set(event.target.value);
    this.reloadFromFirstPage();
  }

  /**
   * Отображение контекстного меню настроек сортировки заданного столбца
   * @param event - данные события мыши
   * @param column - данные столбца таблицы
   */
  onContextMenu(event: MouseEvent, column: IColumn) {
    if (this.isSorted()) {
      event.preventDefault();
      // this.contextMenuField = column.field;
      this.cm.show(event);
      this.cm.model = this.getSortMenu(column);
    }
  }

  /**
   * Формирование списка элементов контекстного меню для выбранного столбца
   * @param column - данные столбца таблицы
   */
  getSortMenu(column: IColumn): MenuItem[] {
    const order = this.sortOrderFor(column.field);
    const index = this.sortIndexFor(column.field);

    return [
      {
        label: 'Сортировать по возрастанию',
        icon: 'pi pi-sort-amount-up-alt',
        disabled: order === 1,
        command: () => this.setSort(column.field, 1, column.type),
      },
      {
        label: 'Сортировать по убыванию',
        icon: 'pi pi-sort-amount-down',
        disabled: order === -1,
        command: () => this.setSort(column.field, -1, column.type),
      },
      {
        label: 'Добавить к сортировке (по возрастанию)',
        icon: 'pi pi-plus',
        disabled: index !== -1,
        command: () => this.addToSort(column.field, 1, column.type),
      },
      {
        label: 'Убрать из сортировки',
        icon: 'pi pi-minus',
        disabled: index === -1,
        command: () => this.removeFromSort(column.field),
      },
      {
        separator: true,
      },
      {
        label: 'Сбросить сортировку',
        icon: 'pi pi-sort-alt-slash',
        disabled: this.multiSortMeta().length === 0,
        command: () => this.setSort(undefined, 0, column.type),
      },
    ];
  }

  /**
   * Установка данных для сортировки
   * @param field - поле сортировки
   * @param order - порядок сортировки для поля
   * @param type - тип данных столбца
   */
  setSort(field: string | undefined, order: 1 | -1 | 0, type: IColumn['type']) {
    if (order === 0 || !field) {
      this.multiSortMeta.set([]);
    } else {
      this.multiSortMeta.set([{ field, order, type }]);
    }
    this.reloadFromFirstPage();
  }

  /**
   * Добавление поля в настройки сортировки
   * @param field - поле сортировки
   * @param order - порядок сортировки для поля
   * @param type - тип данных столбца
   */
  addToSort(field: string, order: 1 | -1, type: IColumn['type']) {
    const current = [...this.multiSortMeta()];
    if (!current.find((m) => m.field === field)) {
      current.push({ field, order, type });
      this.multiSortMeta.set(current);
      this.reloadFromFirstPage();
    }
  }

  /**
   * Удаление поля из настроек сортировки
   * @param field - поле фильтрации
   */
  removeFromSort(field: string) {
    const current = this.multiSortMeta().filter((m) => m.field !== field);
    this.multiSortMeta.set(current);
    this.reloadFromFirstPage();
  }

  // ***********************************************************************************************
  // ******************************* Функции для фильтрации данных *********************************
  // ***********************************************************************************************
  /**
   * Приведение IFilterValue из дочернего фильтра к IColumnFilterMeta.
   * @param column - колонка
   * @param filterData - данные от дочернего компонента
   */
  private normalizeFilter(column: IColumn, filterData: IFilterValue): IColumnFilterMeta {
    let filterValue = filterData.value;

    switch (filterData.matchMode) {
      case 'objectByOptionValue':
        (this as any).context = { column };
        filterValue = filterData.value;
        break;
      case 'in':
        if (filterData.value) {
          filterValue = Array.isArray(filterData.value) ? filterData.value : [filterData.value];
        }
        break;
      case 'between':
      default:
        filterValue = filterData.value;
    }

    return {
      value: filterValue,
      matchMode: filterData.matchMode,
      type: column.type,
    };
  }

  /**
   * Вставить или обновить фильтр для поля с учётом источника.
   * Условие того же источника по тому же полю заменяется; условия других источников сохраняются.
   * @param field - код столбца
   * @param meta - данные фильтра
   * @param source - источник ('row' | 'header')
   */
  private upsertFilter(field: string, meta: IColumnFilterMeta, source: 'row' | 'header'): void {
    if (!this.isFilterFilled(meta)) {
      this.removeFilter(field, source);
      return;
    }

    const current = { ...this.filters() };
    const list = [...(current[field] ?? [])];
    const metaWithSource: IColumnFilterMeta = { ...meta, source };

    const idx = list.findIndex((m) => m.source === source);
    if (idx === -1) {
      list.push(metaWithSource);
    } else {
      list[idx] = metaWithSource;
    }

    current[field] = list;
    this.filters.set(current);
  }

  /**
   * Удалить фильтр для поля по источнику. Если условий больше не осталось — удаляем поле целиком.
   * @param field - код столбца
   * @param source - источник ('row' | 'header')
   */
  private removeFilter(field: string, source: 'row' | 'header'): void {
    const current = { ...this.filters() };
    const list = (current[field] ?? []).filter((m) => m.source !== source);

    if (list.length === 0) {
      delete current[field];
    } else {
      current[field] = list;
    }

    this.filters.set(current);
  }

  /**
   * Проверка есть ли установленные фильтры
   * @param meta - данные фильтра
   * @private
   */
  private isFilterFilled(meta?: IColumnFilterMeta | IColumnFilterMeta[] | null): boolean {
    if (!meta) return false;
    if (Array.isArray(meta)) {
      return meta.some((m) => this.isFilterFilled(m));
    }
    const value = meta.value;
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) {
      return value.length > 0 && value.some((x) => x !== null && x !== undefined && x !== '');
    }
    return true;
  }

  /**
   * Очистка всех фильтров
   */
  clearAllFilters() {
    this.searchValue.set(null);
    this.filters.set({});
    this.resetFilters.set(true);
    this.dt?.clear();
    this.clearPossibleCache();
    this.reloadFromFirstPage();

    setTimeout(() => this.resetFilters.set(false), 100);
  }

  /**
   * Обработка выбранных элементов фильтрации
   * @param column - данные столбца таблицы
   * @param filterData - данные, по которым проводиться фильтрация данных таблицы
   */
  onFilterChange(column: IColumn, filterData: IFilterValue) {
    console.log('onFilterChange filterData = ', filterData);
    const meta = this.normalizeFilter(column, filterData);
    this.upsertFilter(column.field, meta, 'row');
    this.reloadFromFirstPage();
  }

  /**
   * Открытие фильтра в шапке колонки.
   * @param event - событие клика
   * @param field - код столбца
   */
  onShowFilterMultiSelect(event: MouseEvent, field: string): void {
    event.stopPropagation();
    this.activeFilterField.set(field);
    this.loadPossibleValues(field);
  }

  /**
   * Обработка применения фильтра из шапки таблицы.
   * @param column - колонка
   * @param filterData - данные фильтра из дочернего компонента
   */
  onHeaderFilterApply(column: IColumn, filterData: IColumnFilterMeta | null): void {
    if (filterData && this.isFilterFilled(filterData)) {
      this.upsertFilter(column.field, { ...filterData, type: column.type }, 'header');
    } else {
      this.removeFilter(column.field, 'header');
    }

    const button = this.filterButtons.find((b) => b.field() === column.field);
    button?.hidePopover();

    this.reloadFromFirstPage();
  }

  /**
   * Загрузка уникальных значений для колонки с учётом активных фильтров
   * (кроме фильтра по самой колонке) и глобального поиска.
   * @param field - код столбца таблицы
   */
  loadPossibleValues(field: string): void {
    const column = this.columns()?.find((c) => c.field === field);
    if (!column) return;

    // Для типов, где список значений не имеет смысла — не грузим
    if (
      !['object', 'object[]', 'boolean', 'string', 'number', 'date', 'datetime'].includes(
        column.type,
      )
    ) {
      this.possibleValues.update((m) => ({ ...m, [field]: [] }));
      return;
    }

    const filters = this.filtersExcept(field, 'header');
    const key = this.buildPossibleCacheKey(field, filters, this.searchValue());

    const cached = this.possibleCache.get(key);
    if (cached) {
      this.possibleValues.update((m) => ({ ...m, [field]: cached }));
      return;
    }

    this.possibleLoading.update((m) => ({ ...m, [field]: true }));

    this.tableService
      .getPossibleValues(this.data(), {
        column,
        filters,
        globalFilter: this.searchValue(),
      })
      .subscribe({
        next: (values) => {
          this.possibleCache.set(key, values);
          this.possibleValues.update((m) => ({ ...m, [field]: values }));
          this.possibleLoading.update((m) => ({ ...m, [field]: false }));
        },
        error: () => {
          this.possibleLoading.update((m) => ({ ...m, [field]: false }));
        },
      });
  }

  /**
   * Фильтры для построения списка значений колонки:
   * исключаем только фильтр того же источника по этому же полю,
   * чтобы список строился «поверх» уже отфильтрованных данных.
   * @param field - код столбца
   * @param source - источник фильтра, для которого строим список ('row' | 'header')
   */
  private filtersExcept(
    field: string,
    source: 'row' | 'header',
  ): Record<string, IColumnFilterMeta[]> {
    const filters = this.filters();
    const result: Record<string, IColumnFilterMeta[]> = {};

    for (const [f, metas] of Object.entries(filters)) {
      if (f === field) {
        const others = metas.filter((m) => m.source !== source);
        if (others.length > 0) result[f] = others;
      } else {
        result[f] = metas;
      }
    }

    return result;
  }

  /**
   * Ключ кэша уникальных значений.
   * @param field - код столбца
   * @param filters - фильтры по другим колонкам
   * @param globalFilter - значение глобального поиска
   */
  private buildPossibleCacheKey(
    field: string,
    filters: Record<string, IColumnFilterMeta[]>,
    globalFilter: string | null,
  ): string {
    return JSON.stringify({ field, filters, globalFilter });
  }

  /**
   * Сброс кэша уникальных значений.
   */
  private clearPossibleCache(): void {
    this.possibleCache.clear();
    this.possibleValues.set({});
  }
  // ***********************************************************************************************
  // ******************************* Функции для обновления данных *********************************
  // ***********************************************************************************************
  /**
   * Загрузка (обновление) данных с сервера
   * @param event -данные события для обновления данных
   */
  loadData(event: TableLazyLoadEvent | null) {
    if (!event) return;

    if (event.filters) {
      const columns = this.columns() ?? [];

      for (const [field, raw] of Object.entries(event.filters as Record<string, any>)) {
        const column = columns.find((c) => c.field === field);
        const metas: IColumnFilterMeta[] = Array.isArray(raw) ? raw : [raw];

        const normalized: IColumnFilterMeta[] = metas
          .map((m) => (column ? { ...m, type: column.type } : m))
          .filter((m) => this.isFilterFilled(m));

        if (normalized.length === 0) {
          this.removeFilter(field, 'row');
        } else {
          this.upsertFilter(field, normalized[0], 'row');
        }
      }
    }

    this.fetch({
      first: event.first ?? 0,
      rows: event.rows ?? 10,
      globalFilter: event.globalFilter as string | null,
    });
  }

  /**
   * Перезагрузка данных таблицы с установкой первой страницы в 0
   * @private
   */
  private reloadFromFirstPage() {
    this.fetch({
      first: 0,
      rows: this.dt?.rows ?? 10,
      globalFilter: this.searchValue() ?? null,
    });
  }

  /**
   * Очистка поля поиска
   */
  clearSearch() {
    this.searchValue.set(null);
    this.reloadFromFirstPage();
  }

  /**
   * Единая точка запроса данных к сервису.
   * Сортировка берётся из сигналов, остальное — из параметров.
   * @param options - параметры запроса
   */
  private fetch(options: IFetchOptions) {
    this.loading.set(true);

    const filters: Record<string, IColumnFilterMeta[]> = {};
    for (const [field, metas] of Object.entries(this.filters())) {
      const filled = metas.filter((m) => this.isFilterFilled(m));
      if (filled.length === 0) continue;
      filters[field] = filled;
    }

    this.tableService
      .getData(this.data(), {
        multiSortMeta: this.multiSortMeta(),
        filters,
        first: options.first ?? 0,
        rows: options.rows ?? 10,
        globalFilter: options.globalFilter ?? this.searchValue() ?? null,
      })
      .subscribe((res) => {
        this.value = res.data;
        this.totalRecords.set(res.total);
        this.loading.set(false);
      });
  }

  /**
   * Обновление данных таблицы
   * @private
   */
  private initValue() {
    effect(() => {
      console.log('effect data = ', this.data());
      // untracked(() => {
      this.clearPossibleCache();
      this.reloadFromFirstPage();
      // });
    });

    effect(() => console.log('effect columns = ', this.columns()));
    effect(() => console.log('effect filters = ', this.filters()));
  }
}
