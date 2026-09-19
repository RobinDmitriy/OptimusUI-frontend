import { Component, effect, input } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { DatePipe } from '@angular/common';

export interface IColumn {
  field: string;
  caption?: string;
  optionLabel?: string;
  optionValue?: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'object[]' | 'datetime' | 'group' | 'color';
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
  imports: [TableModule, DatePipe],
  selector: 'app-table',
  styleUrl: './table.css',
  templateUrl: './table.html',
})
export class Table {
  columns = input<IColumn[] | undefined>(undefined);
  data = input<any[] | null>(null);

  value: any;

  constructor() {
    this.updateValue();
  }

  /**
   * Обновление данных таблицы
   * @private
   */
  private updateValue() {
    effect(() => {
      this.value = this.data();
    });

    effect(() => console.log('effect columns = ', this.columns()));
  }
}
