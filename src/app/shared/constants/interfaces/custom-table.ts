import { FilterMetadata } from '@openng/optimus-ui/api';

export interface IColumnFilterMeta extends FilterMetadata {
  type: IColumn['type'];
}

export interface ISortMeta {
  field: string;
  order: 1 | -1;
  type: IColumn['type'];
}

export interface ILazyLoadParams {
  multiSortMeta?: ISortMeta[];
  filters?: Record<string, IColumnFilterMeta>;
  first?: number;
  rows?: number | null;
  globalFilter?: string | string[] | null;
}

export interface ILazyLoadResult<T> {
  data: T[];
  total: number;
}

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

export interface IPossibleValue {
  name: string;
  value: string | number | Date;
  selected: boolean;
  disabled?: boolean;
}

export interface IFilterValue {
  value: any;
  matchMode: string;
}
