import { Component, computed, effect, input } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { DatePipe } from '@angular/common';
import { Card } from '@openng/optimus-ui/card';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { IconField } from '@openng/optimus-ui/iconfield';
import { InputIcon } from '@openng/optimus-ui/inputicon';
import { FormsModule } from '@angular/forms';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Button } from '@openng/optimus-ui/button';

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
  ],
  selector: 'app-table',
  styleUrl: './table.css',
  templateUrl: './table.html',
})
export class Table {
  columns = input<IColumn[] | undefined>(undefined);
  data = input<any[] | null>(null);

  showPanelInput = input<boolean>(true);
  showToolbar = input<boolean>(true);
  title = input<string>('');
  showContentFilter = input<boolean>(true);

  value: any;
  searchValue?: string;

  showPanel = computed(() => this.showPanelInput() && this.data());

  constructor() {
    this.updateValue();
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
