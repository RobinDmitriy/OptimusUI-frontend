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
import { FilterMetadata, MenuItem } from '@openng/optimus-ui/api';
import { TableService } from '../../services';
import { IColumn, IFilterValue, ISortMeta } from '../../constants';
import { OverlayBadge } from '@openng/optimus-ui/overlaybadge';
import { TableColumnFilter } from './table-column-filter/table-column-filter';

interface IFetchOptions {
  first?: number;
  rows?: number;
  filters?: Record<string, any>;
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

  value: any;
  searchValue = signal<string | null>(null);
  totalRecords = signal(0);
  loading = signal(false);
  resetFilters = signal<boolean>(false);

  multiSortMeta = signal<ISortMeta[]>([]);

  showPanel = computed(() => this.showPanelInput() && this.data().length > 0);
  isSorted = computed(() => this.isSortedInput());
  isNotFilters = computed(() => this.searchValue() === null);

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
        currentMeta.push({ field: column.field, order: 1 });
      } else {
        // Цикл для существующего: 1 → -1 → удалить
        const currentOrder = currentMeta[existingIndex].order;
        if (currentOrder === 1) {
          currentMeta[existingIndex].order = -1;
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
          currentMeta[0] = { field: column.field, order: -1 };
        } else {
          currentMeta.length = 0; // сброс
        }
      } else {
        // Новый столбец или клик по одному из многих — заменяем всё
        currentMeta.length = 0;
        currentMeta.push({ field: column.field, order: 1 });
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
        command: () => this.setSort(column.field, 1),
      },
      {
        label: 'Сортировать по убыванию',
        icon: 'pi pi-sort-amount-down',
        disabled: order === -1,
        command: () => this.setSort(column.field, -1),
      },
      {
        label: 'Добавить к сортировке (по возрастанию)',
        icon: 'pi pi-plus',
        disabled: index !== -1,
        command: () => this.addToSort(column.field, 1),
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
        command: () => this.setSort(undefined, 0),
      },
    ];
  }

  /**
   * Установка данных для сортировки
   * @param field - поле фильтрации
   * @param order - порядок фильтрации для поля
   */
  setSort(field: string | undefined, order: 1 | -1 | 0) {
    if (order === 0 || !field) {
      this.multiSortMeta.set([]);
    } else {
      this.multiSortMeta.set([{ field, order }]);
    }
    this.reloadFromFirstPage();
  }

  /**
   * Добавление поля в настройки сортировки
   * @param field - поле фильтрации
   * @param order - порядок фильтрации для поля
   */
  addToSort(field: string, order: 1 | -1) {
    const current = [...this.multiSortMeta()];
    if (!current.find((m) => m.field === field)) {
      current.push({ field, order });
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
  // ******************************* Функции для сортировки данных *********************************
  // ***********************************************************************************************
  /**
   * Очистка всех фильтров
   */
  clearAllFilters() {
    // if (!this.dt) return;
    //
    // this.dt.clear();
    this.searchValue.set(null);
    // this.selectedFilterColumn = null;
    // this.dt.filterGlobal('', 'contains');
    //
    // this.resetFilterMaps();
    //
    // this.resetFilters.set(true);
    // this.filteredData.set(null);
    // this.currentFilterColumn.set(null);
    // this.activeFilterField.set(null);
    //
    // setTimeout(() => this.resetFilters.set(false), 100);
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
    let filter: FilterMetadata = {
      value: filterValue,
      matchMode: filterData.matchMode,
      operator: 'and',
    };

    // if (this.comparedMode && column.type !== 'object') {
    //   filter = this.adaptFilterForComparisonMode(filter);
    // }
    console.log('onFilterChange filter = ', filter);

    // this.singleFilterColumn.set(column.field, filter);
    // this.currentFilterColumn.set(column);
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

    this.fetch({
      first: event.first ?? 0,
      rows: event.rows ?? 10,
      filters: event.filters as Record<string, any>,
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
      filters: this.dt?.filters as Record<string, any>,
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

    this.tableService
      .getData(this.data(), {
        multiSortMeta: this.multiSortMeta(),
        filters: options.filters ?? {},
        first: options.first ?? 0,
        rows: options.rows ?? 10,
        globalFilter: options.globalFilter ?? null,
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
      this.value = this.data();
      this.reloadFromFirstPage();
    });

    effect(() => console.log('effect columns = ', this.columns()));
  }
}
