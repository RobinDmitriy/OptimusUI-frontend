import { Component, computed, effect, inject, input, signal, ViewChild } from '@angular/core';
import { Table, TableLazyLoadEvent, TableModule } from '@openng/optimus-ui/table';
import { DatePipe } from '@angular/common';
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
import { IColumn, IColumnFilterMeta, IFilterValue, ISortMeta } from '../../constants';
import { OverlayBadge } from '@openng/optimus-ui/overlaybadge';
import { TableColumnFilter } from './table-column-filter/table-column-filter';

interface IFetchOptions {
  first?: number;
  rows?: number;
  filters?: Record<string, IColumnFilterMeta>;
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
    OverlayBadge,
    TableColumnFilter,
  ],
  selector: 'app-custom-table',
  styleUrl: './custom-table.css',
  templateUrl: './custom-table.html',
})
export class CustomTable {
  @ViewChild('dt') dt!: Table;
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
  showClearAllFilterButton = input<boolean>(true);
  showPaginator = input<boolean>(true);

  value: any;
  searchValue = signal<string | null>(null);
  totalRecords = signal(0);
  loading = signal(false);

  filters = signal<Record<string, IColumnFilterMeta>>({});
  resetFilters = signal<boolean>(false);

  multiSortMeta = signal<ISortMeta[]>([]);

  showPanel = computed(() => this.showPanelInput() && this.data().length > 0);
  isSorted = computed(() => this.isSortedInput());
  isNotFilters = computed(() => this.searchValue() === null && !this.hasFilters());
  hasFilters = computed(() => {
    const filters = this.filters();
    return Object.values(filters).some((m) => this.isFilterFilled(m));
  });

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
      filters: this.dt?.filters as Record<string, any>,
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
   * Проверка есть ли установленные фильтры
   * @param meta - данные фильтра
   * @private
   */
  private isFilterFilled(meta: IColumnFilterMeta | undefined): boolean {
    if (!meta) return false;
    const value = meta.value;
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value))
      return value.length > 0 && value.some((x) => x !== null && x !== undefined && x !== '');
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
    let filterValue;

    switch (filterData.matchMode) {
      case 'objectByOptionValue':
        (this as any).context = { column };
        filterValue = filterData.value;
        break;
      case 'in':
        if (filterData.value) {
          filterValue = Array.isArray(filterData.value) ? filterData.value : [filterData.value];
        } else {
          filterValue = filterData.value;
        }
        break;
      case 'between':
        filterValue = filterData.value; // для between ожидается массив [min, max]
        break;
      default:
        // для equals, lt, gt, lte, gte и т.д. - просто значение
        filterValue = filterData.value;
    }

    // Адаптируем фильтр для режима сравнения
    let filter: IColumnFilterMeta = {
      value: filterValue,
      matchMode: filterData.matchMode,
      operator: 'and',
      type: column.type,
    };

    const currentFilters = { ...this.filters() };

    if (this.isFilterFilled(filter)) {
      currentFilters[column.field] = filter;
    } else {
      delete currentFilters[column.field];
    }

    this.filters.set(currentFilters);
    console.log('onFilterChange filterData = ', filter);
    this.reloadFromFirstPage();
  }

  // ***********************************************************************************************
  // ******************************* Функции для обновления данных *********************************
  // ***********************************************************************************************
  /**
   * Загрузка (обновление) данных с сервера
   * @param event -данные события для обновления данных
   */
  loadData(event: TableLazyLoadEvent | null) {
    console.log('loadData event = ', event);
    if (!event) return;

    if (event.filters) {
      const next: Record<string, IColumnFilterMeta> = { ...this.filters() };
      for (const [field, meta] of Object.entries(
        event.filters as Record<string, IColumnFilterMeta>,
      )) {
        if (this.isFilterFilled(meta)) next[field] = meta;
        else delete next[field];
      }
      this.filters.set(next);
    }

    this.fetch({
      first: event.first ?? 0,
      rows: event.rows ?? 10,
      filters: this.filters(),
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
      filters: this.dt?.filters as Record<string, IColumnFilterMeta>,
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
    const mergedFilters = { ...(options.filters ?? {}), ...this.filters() };

    const filters: Record<string, IColumnFilterMeta> = {};
    for (const [field, meta] of Object.entries(mergedFilters)) {
      if (this.isFilterFilled(meta)) filters[field] = meta;
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
      // this.value = this.data();
      this.reloadFromFirstPage();
    });

    effect(() => console.log('effect columns = ', this.columns()));
    effect(() => console.log('effect filters = ', this.filters()));
  }
}
