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
import { Tree } from '@openng/optimus-ui/tree';
import { Button } from '@openng/optimus-ui/button';
import { PrimeTemplate, TreeNode } from '@openng/optimus-ui/api';
import { ColorView } from '../color-view/color-view';
import { IColumn, IColumnFilterMeta, IDateFilterValue, IPossibleValue } from '../../../constants';

@Component({
  selector: 'app-table-header-column-filter',
  imports: [FormsModule, Listbox, Tree, Button, PrimeTemplate, ColorView],
  templateUrl: './table-header-column-filter.html',
  styleUrl: './table-header-column-filter.scss',
})
export class TableHeaderColumnFilter {
  @ViewChild('listValues') listValues!: Listbox;

  column = input.required<IColumn>();
  currentFilter = input<any[]>([]);
  options = input<IPossibleValue[]>([]);
  treeData = input<TreeNode[]>([]);
  loading = input<boolean>(false);

  columnFilters = output<IColumnFilterMeta | null>();

  /**
   * Текущий выбор.
   * - Для не-дат: массив значений (string | number | Date).
   * - Для дат: массив IDateFilterValue.
   */
  selectedFilterValues: any[] = [];
  selectedTreeNodes = signal<TreeNode[]>([]);

  isDate = computed(() => ['datetime', 'date'].includes(this.column().type));

  constructor() {
    // Синхронизация currentFilter → selectedFilterValues
    // и восстановление выбранных узлов дерева для p-tree
    effect(() => {
      const current = this.currentFilter();
      const tree = this.treeData();

      untracked(() => {
        this.selectedFilterValues = [...current];

        if (this.isDate()) {
          this.selectedTreeNodes.set(this.findNodesByValues(tree, current));
        }
      });
    });
  }

  /**
   * Применить фильтр.
   */
  applyFilter(): void {
    this.columnFilters.emit({
      value: this.selectedFilterValues.length ? this.selectedFilterValues : null,
      matchMode: 'in',
      type: this.column().type,
    });
  }

  /**
   * Сбросить выбор
   */
  clearFilter() {
    this.selectedFilterValues = [];
    this.selectedTreeNodes.set([]);
    this.columnFilters.emit(null);
  }

  /**
   * Обработка выбора узлов в p-tree.
   * Преобразует узлы в массив IDateFilterValue.
   */
  onTreeSelectionChange(event: TreeNode | TreeNode[] | null | undefined): void {
    const nodes = !event ? [] : Array.isArray(event) ? event : [event];
    this.selectedTreeNodes.set(nodes);
    this.selectedFilterValues = nodes
      .map((n) => n.data?.value as IDateFilterValue | undefined)
      .filter((v): v is IDateFilterValue => !!v);
  }

  /**
   * Поиск узлов дерева, соответствующих заданным IDateFilterValue.
   * Обязательно возвращаем ссылки на те же объекты, что лежат в tree,
   * иначе p-tree не подсветит их как выбранные.
   */
  private findNodesByValues(tree: TreeNode[], values: any[]): TreeNode[] {
    if (!tree.length || !values.length) return [];

    const result: TreeNode[] = [];
    const wanted = new Set(values.map((v) => this.dateValueKey(v)));

    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        const v = n.data?.value as IDateFilterValue | undefined;
        if (v && wanted.has(this.dateValueKey(v))) {
          result.push(n);
        }
        if (n.children?.length) {
          walk(n.children);
        }
      }
    };

    walk(tree);
    return result;
  }

  /**
   * Ключ IDateFilterValue для сопоставления.
   */
  private dateValueKey(v: any): string {
    if (v == null) return '';
    if (typeof v === 'object' && typeof v.year === 'number') {
      return `${v.year}-${v.month ?? '*'}-${v.day ?? '*'}`;
    }
    return String(v);
  }
}
