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

export interface IColumn {
  field: string;
  caption?: string;
  optionLabel?: string;
  optionValue?: string;
  type:
    | 'string'
    | 'number'
    | 'date'
    | 'boolean'
    | 'object'
    | 'object[]'
    | 'datetime'
    | 'group'
    | 'color';
  isLocked?: boolean;
  alignFrozen?: string;
  // options?: ILookup[];
  info?: string;
  // colspan?: number;
  width?: number | string;
  // alignment?: HorizontalAlignment;
  format?: string;
  // isRequired?: boolean;
  isVisible?: boolean;
  editable?: boolean;
  // allowFiltering?: boolean;
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

  showPanelInput = input<boolean>(true);
  showToolbar = input<boolean>(true);
  title = input<string>('');
  showContentFilter = input<boolean>(true);
  isSortedInput = input<boolean>(true);
  sortMode = input<'single' | 'multiple'>('single');

  value: any;
  searchValue?: string;
  totalRecords = signal(0);
  loading = signal(false);
  sortField = signal<string | string[] | null | undefined>(undefined);
  sortOrder =  signal<1 | -1 | 0 | undefined>(undefined);

  showPanel = computed(() => this.showPanelInput() && this.data().length > 0);
  isSorted = computed(() => this.isSortedInput());

  private tableService = inject(TableService);

  constructor() {
    this.updateValue();
  }

  /**
   * Загрузка (обновление) данных с сервера
   * @param event -данные события для обновления данных
   */
  loadData(event: TableLazyLoadEvent | null) {
    if (!event) return;

    const clickedField = Array.isArray(event.sortField)
      ? event.sortField[0] : (event.sortField ?? undefined);

    let field = this.sortField();
    let order = this.sortOrder();

    if (clickedField !== field) {
      field = clickedField;
      order = clickedField ? 1 : 0;
    } else {
      order = order === 0 ? 1 : order === 1 ? -1 : 0;
      if (order === 0) field = undefined;
    }

    this.sortField.set(field);
    this.sortOrder.set(order);

    this.loading.set(true);

    this.tableService
      .getData(this.data(), {
        sortField: field,
        sortOrder: order,
        filters: event.filters as Record<string, any>,
        first: event.first,
        rows: event.rows,
        globalFilter: event.globalFilter,
      })
      .subscribe((res) => {
        console.log('res = ', res);
        this.value = res.data;
        this.totalRecords.set(res.total);
        this.loading.set(false);
      });
  }

  /**
   * Установка фильтрации данных по введённому значению в поле поиска
   * @param event - данные события ввода данных
   */
  setFilterSearch(event: any) {
    this.searchValue = event.target.value;
    // this.applyCustomGlobalFilter();
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
    return [
      {
        label: 'Сортировать по возрастанию',
        icon: 'pi pi-sort-amount-up-alt',
        disabled: this.dt.sortField === column.field && this.dt.sortOrder === 1,
        // command: () => this.setSortOptions(column.field, 1),
      },
      {
        disabled: this.dt.sortField === column.field && this.dt.sortOrder === -1,
        label: 'Сортировать по убыванию',
        icon: 'pi pi-sort-amount-down',
        // command: () => this.setSortOptions(column.field, -1),
      },
      {
        // disabled: this.sortOptions().order === 0 || this.sortOptions().field !== column.field,
        label: 'Сбросить сортировку',
        icon: 'pi pi-sort-alt-slash',
        // command: () => this.setSortOptions(column.field, 0),
      },
      // {
      //   separator: true
      // },
      // {
      //   label: column.isLocked ? 'Разблокировать' : 'Заблокировать',
      //   icon: column.isLocked ? 'pi pi-lock-open' : 'pi pi-lock',
      //   command: () => this.setLockColumn(column)
      // }
    ];
  }

  /**
   * Очистка поля поиска
   */
  clearSearch() {
    this.searchValue = '';
    // this.applyCustomGlobalFilter();
  }

  /**
   * Обновление данных таблицы
   * @private
   */
  private updateValue() {
    effect(() => {
      console.log('effect data = ', this.data());
      this.value = this.data();
    });

    effect(() => console.log('effect columns = ', this.columns()));
  }
}
