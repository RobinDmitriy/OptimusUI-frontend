import { MenuItem } from '@openng/optimus-ui/api';

export const FILTER_TYPE_ITEMS: { [key: string]: MenuItem[] } = {
  'number[]': [
    {
      id: 'equals',
      label: 'Равно',
      icon: 'equals',
    },
    {
      id: 'notEquals',
      label: 'Не равно',
      icon: 'not-equals',
    },
    {
      id: 'lt',
      label: 'Меньше',
      icon: 'less',
    },
    {
      id: 'gt',
      label: 'Больше',
      icon: 'greater',
    },
    {
      id: 'lte',
      label: 'Меньше или равно',
      icon: 'less-than-equal',
    },
    {
      id: 'gte',
      label: 'Больше или равно',
      icon: 'greater-than-equal',
    },
    {
      id: 'between',
      label: 'В диапазоне',
      icon: 'between',
    },
    {
      id: 'startsWith',
      label: 'Сбросить',
      icon: 'search',
    },
  ],
  number: [
    {
      id: 'equals',
      label: 'Равно',
      icon: 'equals',
    },
    {
      id: 'notEquals',
      label: 'Не равно',
      icon: 'not-equals',
    },
    {
      id: 'lt',
      label: 'Меньше',
      icon: 'less',
    },
    {
      id: 'gt',
      label: 'Больше',
      icon: 'greater',
    },
    {
      id: 'lte',
      label: 'Меньше или равно',
      icon: 'less-than-equal',
    },
    {
      id: 'gte',
      label: 'Больше или равно',
      icon: 'greater-than-equal',
    },
    {
      id: 'between',
      label: 'В диапазоне',
      icon: 'between',
    },
    {
      id: 'startsWith',
      label: 'Сбросить',
      icon: 'search',
    },
  ],
  string: [
    {
      id: 'contains',
      label: 'Содержит',
      icon: 'contains',
    },
    {
      id: 'notContains',
      label: 'Не содержит',
      icon: 'notContains',
    },
    {
      id: 'startsWith',
      label: 'Начинается с',
      icon: 'startsWith',
    },
    {
      id: 'endsWith',
      label: 'Заканчивается на',
      icon: 'endsWith',
    },
    {
      id: 'equals',
      label: 'Равно',
      icon: 'equals',
    },
    {
      id: 'notEquals',
      label: 'Не равно',
      icon: 'not-equals',
    },
    {
      label: 'Сбросить',
      icon: 'search',
    },
  ],
  date: [
    {
      id: 'equals',
      label: 'Равно',
      icon: 'equals',
    },
    {
      id: 'notEquals',
      label: 'Не равно',
      icon: 'not-equals',
    },
    {
      id: 'lt',
      label: 'Меньше',
      icon: 'less',
    },
    {
      id: 'gt',
      label: 'Больше',
      icon: 'greater',
    },
    {
      id: 'lte',
      label: 'Меньше или равно',
      icon: 'less-than-equal',
    },
    {
      id: 'gte',
      label: 'Больше или равно',
      icon: 'greater-than-equal',
    },
    {
      id: 'between',
      label: 'В диапазоне',
      icon: 'between',
    },
    {
      id: 'startsWith',
      label: 'Сбросить',
      icon: 'search',
    },
  ],
  datetime: [
    {
      id: 'is',
      label: 'Равно',
      icon: 'equals',
    },
    {
      id: 'isNot',
      label: 'Не равно',
      icon: 'not-equals',
    },
    {
      id: 'dateBefore',
      label: 'Меньше',
      icon: 'less',
    },
    {
      id: 'dateAfter',
      label: 'Больше',
      icon: 'greater',
    },
    {
      id: 'dateBeforeOrEqual',
      label: 'Меньше или равно',
      icon: 'less-than-equal',
    },
    {
      id: 'dateAfterOrEqual',
      label: 'Больше или равно',
      icon: 'greater-than-equal',
    },
    {
      id: 'dateBetween',
      label: 'В диапазоне',
      icon: 'between',
    },
    {
      id: 'startsWith',
      label: 'Сбросить',
      icon: 'search',
    },
  ],
  boolean: [
    {
      id: 'contains',
      label: 'Содержит',
      icon: 'contains',
    },
    // {
    //   id: 'is',
    //   label: 'Равно',
    //   icon: 'equals'
    // },
    // {
    //   id: 'isNot',
    //   label: 'Не равно',
    //   icon: 'not-equals'
    // },
    {
      id: 'startsWith',
      label: 'Сбросить',
      icon: 'search',
    },
  ],
};

// class FilterMatchMode {
//   static STARTS_WITH = 'startsWith';
//   static CONTAINS = 'contains';
//   static NOT_CONTAINS = 'notContains';
//   static ENDS_WITH = 'endsWith';
//   static EQUALS = 'equals';
//   static NOT_EQUALS = 'notEquals';
//   static IN = 'in';
//   static LESS_THAN = 'lt';
//   static LESS_THAN_OR_EQUAL_TO = 'lte';
//   static GREATER_THAN = 'gt';
//   static GREATER_THAN_OR_EQUAL_TO = 'gte';
//   static BETWEEN = 'between';
//   static IS = 'is';
//   static IS_NOT = 'isNot';
//   static BEFORE = 'before';
//   static AFTER = 'after';
//   static DATE_IS = 'dateIs';
//   static DATE_IS_NOT = 'dateIsNot';
//   static DATE_BEFORE = 'dateBefore';
//   static DATE_AFTER = 'dateAfter';
// }
// class FilterOperator {
//   static AND = 'and';
//   static OR = 'or';
// }

