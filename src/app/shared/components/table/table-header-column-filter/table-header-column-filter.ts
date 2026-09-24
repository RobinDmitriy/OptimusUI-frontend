import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Listbox } from '@openng/optimus-ui/listbox';
import { ColorView } from '../color-view/color-view';
import { TreeNode } from '@openng/optimus-ui/api';
import { IColumn, IColumnFilterMeta, IPossibleValue } from '../../../constants';
import { Button } from '@openng/optimus-ui/button';

@Component({
  selector: 'app-table-header-column-filter',
  imports: [FormsModule, Listbox, ColorView, Button],
  templateUrl: './table-header-column-filter.html',
  styleUrl: './table-header-column-filter.scss',
})
export class TableHeaderColumnFilter {
  @ViewChild('listValues') listValues!: Listbox;
  // @ViewChild('treeValues') treeValues!: Tree;

  column = input.required<IColumn>();
  currentFilter = input<any[]>([]);
  options = input<IPossibleValue[]>([]);
  loading = input<boolean>(false);

  columnFilters = output<IColumnFilterMeta | null>();

  isExpendAll = false;
  selectedFilterValues: any[] = [];
  initFiltersDate: string[] = [];
  initFilters: any[] = [];

  optionsView = signal<IPossibleValue[]>([]);
  // treeData = signal<TreeNode[]>([]);

  isDate = computed(() => ['datetime', 'date'].includes(this.column().type));

  // private periodService = inject(PeriodService);

  constructor() {
    effect(() => {
      const current = this.currentFilter();
      console.log('effect current = ', current);
      untracked(() => {
        this.selectedFilterValues = [...current];
        this.initFilters = [...current];
      });
    });

    effect(() => (this.isExpendAll = !(this.options().length > 5)));

    effect(() => {
      // if (this.isDate()) {
      //   this.initFiltersDate =
      //     this.currentFilter() && this.currentFilter().length > 0 ? [...this.currentFilter()] : [];
      // this.initFiltersDate = this.filters() && this.filters().length > 0 ? [...this.filters()] : [];
      // } else {
      this.initFilters = this.currentFilter().filter((item) => item !== null);
      // }
    });

    // effect(() => {
    //   if (this.isDate()) {
    //     this.treeData.set(
    //       this.periodService.createDateTreeNode(this.options(), this.initFiltersDate),
    //     );
    //   }
    // });

    // effect(() => {
    //   // console.log('effect this.options() = ', this.options());
    //   this.selectedFilterValues = this.options()
    //     .filter((item) => item.selected)
    //     .map((item) => item.value);
    //   // console.log('effect this.selectedFilterValues = ', this.selectedFilterValues);
    // });
    // effect(() => {
    //   untracked(() => {
    //     console.log('effect this.options() = ', this.options());
    //   });
    //   // this.selectedFilterValues = this.options()
    //   //   .filter((item) => item.selected)
    //   //   .map((item) => item.value);
    //   // console.log('effect this.selectedFilterValues = ', this.selectedFilterValues);
    // });
  }

  /**
   * Обработка события нажатия на кнопку Отмена
   */
  closePopover() {
    // if (this.isDate()) {
    //   this.columnFilters.emit({
    //     value: this.initFiltersDate,
    //     matchMode: this.initFiltersDate.length > 0 ? 'dateContain' : 'in',
    //     operator: 'and',
    //   });
    //   this.treeData.set(
    //     this.periodService.createDateTreeNode(this.options(), this.initFiltersDate),
    //   );
    //   this.treeValues.updateSerializedValue();
    // } else {
    this.selectedFilterValues = this.initFilters;
    this.applyFilter();
    // }
  }

  /**
   * Обработка события нажатия на кнопку Выбрать
   */
  applyFilter() {
    this.columnFilters.emit({
      value: this.getValues(),
      matchMode: this.isDate() ? 'dateContain' : 'in',
      operator: 'and',
      type: 'string',
    });
  }

  /**
   * Получение данных для фильтрации
   */
  getValues() {
    if (this.selectedFilterValues.length === 0) return null;

    // if (this.isDate()) {
    //   return this.periodService.getDateRangeFromSelectedNodes(this.selectedFilterValues);
    // }
    // console.log('getValues this.selectedFilterValues = ', this.selectedFilterValues);
    return this.selectedFilterValues;
  }

  /**
   * Определение выбранных узлов дерева
   * @param event - данные события
   */
  onSelectionChange(event: TreeNode | TreeNode[] | null | undefined) {
    // console.log('onSelectionChange event = ', event);
    if (event) {
      this.selectedFilterValues = Array.isArray(event) ? event : [event];
    } else {
      this.selectedFilterValues = [];
    }
  }

  /**
   * Обработка события при нажатии на кнопку Показать всё / Свернуть
   * @protected
   */
  protected onToggleExpandedAll() {
    this.isExpendAll = !this.isExpendAll;
    if (this.isExpendAll) {
      this.optionsView.set(this.options());
    } else {
      this.optionsView.set(this.options().slice(0, 5));
    }
  }
}
