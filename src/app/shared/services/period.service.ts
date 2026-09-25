import { Injectable } from '@angular/core';

// export interface IDateRange {
//   begin: moment.Moment;
//   end: moment.Moment;
// }

@Injectable({
  providedIn: 'root',
})
export class PeriodService {
  // http = inject(HttpClient);
  // store$ = inject(Store);

  /**
   * Преобразование формата даты, представленной строкой
   * @param date - дата в виде строки
   * @param format - новый формат даты
   */
  // convertFormatDateString(date: string, format = 'DD.MM.YYYY'): string {
  //   return moment(date).format(format);
  // }

  /**
   * Получение списка предыдущих периодов для сравнения
   * @param selectedPeriod - период отбора данных
   */
  // getComparedPeriods(selectedPeriod: IPeriod | null): IPeriod[] {
  //   if (!selectedPeriod) return [];
  //   if ([1, 2, 11].includes(selectedPeriod.id)) return [];
  //
  //   const title = this.getTitleCompared(selectedPeriod.name);
  //   if (!title) return [];
  //
  //   const range = this.toDatesFromString(selectedPeriod.range);
  //   const comparedPeriods: IPeriod[] = [
  //     { id: 1, name: 'Без сравнения', range: { begin: '', end: '' } },
  //   ];
  //
  //   const addComparisonPeriod = (id: number, name: string, getRange: () => IDateRange) => {
  //     comparedPeriods.push({
  //       id,
  //       name,
  //       range: this.toFormattedStrings(getRange()),
  //     });
  //   };
  //
  //   switch (title) {
  //     case 'год': {
  //       addComparisonPeriod(2, 'Предыдущий год', () => this.getPreviousYear(range!));
  //       break;
  //     }
  //
  //     case 'полугодие': {
  //       addComparisonPeriod(2, 'Предыдущее полугодие', () => this.getPreviousHalfYear(range!));
  //       addComparisonPeriod(3, 'Аналогичный период предыдущего года', () =>
  //         this.getPreviousYear(range!),
  //       );
  //       break;
  //     }
  //
  //     case 'квартал': {
  //       addComparisonPeriod(2, 'Предыдущий квартал', () => this.getPreviousQuarter(range!.begin));
  //       addComparisonPeriod(3, 'Аналогичный период предыдущего года', () =>
  //         this.getPreviousYear(range!),
  //       );
  //       break;
  //     }
  //
  //     case 'месяц': {
  //       addComparisonPeriod(2, 'Предыдущий месяц', () => this.getPreviousMonth(range!.begin));
  //       addComparisonPeriod(3, 'Аналогичный период предыдущего года', () =>
  //         this.getPreviousYear(range!),
  //       );
  //       break;
  //     }
  //
  //     default:
  //       return [];
  //   }
  //
  //   return comparedPeriods;
  // }

  /**
   * Формирование строки по выбранному периоду времени
   * @param selectedPeriod - данные выбранного периода времени
   * @param isPrediction - признак, что текущий модуль Прогнозирование
   */
  // getSubTitle(selectedPeriod: IPeriod | null, isPrediction: boolean) {
  //   // console.log('getSubTitle isPrediction = ', isPrediction);
  //   if (!selectedPeriod || isPrediction) return '';
  //
  //   if (selectedPeriod.id === 0) {
  //     return 'за всю историю имеющихся данных';
  //   }
  //
  //   if (selectedPeriod.id === 1) {
  //     return `за ${selectedPeriod.range.begin.slice(0, 4)} год`;
  //   }
  //   if ([2, 3].includes(selectedPeriod.id)) {
  //     return `c ${selectedPeriod.range.begin.slice(0, 4)} по ${selectedPeriod.range.end.slice(
  //       0,
  //       4,
  //     )} года`;
  //   }
  //   if (selectedPeriod.id === 4) {
  //     return `c ${this.convertFormatDateString(selectedPeriod.range.begin)} года по ${this.convertFormatDateString(
  //       selectedPeriod.range.end,
  //     )} года`;
  //   }
  //   if ([5, 6, 7, 8, 9, 10].includes(selectedPeriod.id)) {
  //     return `за ${selectedPeriod.name} ${selectedPeriod.range.end.slice(0, 4)} года`;
  //   }
  //   // console.log('getSubTitle selectedPeriod.range = ', selectedPeriod.range);
  //   if (selectedPeriod.id === 11) {
  //     return `за ${PRIMENG_RU.monthNames[parseInt(selectedPeriod.range.begin.slice(5, 7))].toLowerCase()} ${selectedPeriod.range.end.slice(
  //       0,
  //       4,
  //     )} года`;
  //   }
  //   return '';
  // }

  //********************************************************************************
  /**
   * Первое полугодие (январь - июнь)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getFirstHalfYear(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 0, 1]).startOf('day'), // 1 января
  //     end: moment([year, 6, 1]).endOf('day'), // 30 июня
  //   };
  // }

  /**
   * Второе полугодие (июль - декабрь)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getSecondHalfYear(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 6, 1]).startOf('day'), // 1 июля
  //     end: moment([year + 1, 0, 1]).endOf('day'), // 1 января
  //   };
  // }

  /**
   * Первый квартал (январь - март)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getFirstQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 0, 1]).startOf('day'), // 1 января
  //     end: moment([year, 3, 11]).endOf('day'), // 1 апреля
  //   };
  // }

  /**
   * Второй квартал (апрель - июнь)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getSecondQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 3, 1]).startOf('day'), // 1 апреля
  //     end: moment([year, 6, 1]).endOf('day'), // 1 июля
  //   };
  // }

  /**
   * Третий квартал (июль - сентябрь)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getThirdQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 6, 1]).startOf('day'), // 1 июля
  //     end: moment([year, 9, 1]).endOf('day'), // 1 октября
  //   };
  // }

  /**
   * Четвертый квартал (октябрь - декабрь)
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getFourthQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const year = baseDate.year();
  //
  //   return {
  //     begin: moment([year, 9, 1]).startOf('day'), // 1 октября
  //     end: moment([year + 1, 0, 1]).endOf('day'), // 1 января
  //   };
  // }

  /**
   * Предыдущий квартал
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getPreviousQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const previousQuarterDate = baseDate.clone().subtract(3, 'months');
  //
  //   return this.getQuarterByDate(previousQuarterDate);
  // }

  /**
   * Предыдущий год
   * @param range - исходный диапазон дат
   */
  // getPreviousYear(range: IDateRange): IDateRange {
  //   return {
  //     begin: range.begin.clone().subtract(1, 'year'),
  //     end: range.end.clone().subtract(1, 'year'),
  //   };
  // }

  /**
   * Предыдущее полугодие
   * @param range - исходный диапазон дат
   */
  // getPreviousHalfYear(range: IDateRange): IDateRange {
  //   return {
  //     begin: range.begin.clone().subtract(6, 'month'),
  //     end: range.end.clone().subtract(6, 'month'),
  //   };
  // }

  /**
   * Текущий месяц
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getCurrentMonth(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //
  //   return {
  //     begin: baseDate.clone().startOf('month'),
  //     end: baseDate.clone().endOf('month'),
  //   };
  // }

  /**
   * Предыдущий месяц
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getPreviousMonth(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   const previousMonth = baseDate.clone().subtract(1, 'month');
  //
  //   return {
  //     begin: previousMonth.clone().startOf('month'),
  //     end: baseDate.clone().startOf('month'),
  //   };
  // }

  /**
   * Текущий квартал
   * @param date - исходная дата (по умолчанию текущая)
   */
  // getCurrentQuarter(date?: moment.Moment): IDateRange {
  //   const baseDate = date ? moment(date) : moment();
  //   return this.getQuarterByDate(baseDate);
  // }

  /**
   * Утилитарные методы для преобразования в разные форматы
   * @param range - диапазон дат
   */
  // toDateObjects(range: IDateRange): { begin: Date; end: Date } {
  //   return {
  //     begin: range.begin.toDate(),
  //     end: range.end.toDate(),
  //   };
  // }

  // toISOStrings(range: IDateRange): IDateRangeStrings {
  //   return {
  //     begin: range.begin.toISOString(),
  //     end: range.end.toISOString(),
  //   };
  // }

  /**
   * Преобразование диапазона дат в строки
   * @param range - диапазон дат
   * @param format - формат представления данных
   */
  // toFormattedStrings(range: IDateRange, format: string = 'YYYY-MM-DD HH:mm:ss'): IDateRangeStrings {
  // toFormattedStrings(range: IDateRange, format: string = 'YYYY-MM-DD'): IDateRangeStrings {
  //   return {
  //     begin: range.begin.format(format),
  //     end: range.end.format(format),
  //   };
  // }

  /**
   * Преобразование строкового диапазона дат в даты
   * @param range - строковый диапазон дат
   * @param format - формат исходных данных
   */
  // toDatesFromString(range: IDateRangeStrings, format: string = 'YYYY-MM-DD'): IDateRange {
  //   return {
  //     begin: moment(range.begin, format),
  //     end: moment(range.end, format),
  //   };
  // }

  /**
   * Преобразование массива возможных значений дат к виду дерева
   * @param dateItems - исходные данные
   * @param currentFilters - текущее значение фильтра
   * @param mode - режим формирования дерева
   */
  // createDateTreeNode(
  //   dateItems: IPossibleValue[],
  //   currentFilters: string[],
  //   mode = 'datetime',
  // ): TreeNode[] {
  //   const uniqueDates = Array.from(new Set(dateItems.map((item) => item.value))).map((value) =>
  //     moment(value),
  //   );
  //
  //   // Группируем уникальные годы
  //   const years = Array.from(new Set(uniqueDates.map((m) => m.year()))).sort((a, b) => a - b);
  //
  //   return years.map((year) => {
  //     const yearDates = uniqueDates.filter((m) => m.year() === year);
  //     const months = Array.from(new Set(yearDates.map((m) => m.month()))).sort((a, b) => a - b);
  //
  //     const monthNodes: TreeNode[] = months.map((month) => {
  //       const monthDates = yearDates.filter((m) => m.month() === month);
  //       const days = Array.from(new Set(monthDates.map((m) => m.date()))).sort((a, b) => a - b);
  //
  //       const dayNodes: TreeNode[] = days.map((day) => {
  //         const dayDates = monthDates.filter((m) => m.date() === day);
  //         const hours = Array.from(new Set(dayDates.map((m) => m.hours()))).sort((a, b) => a - b);
  //
  //         const hourNodes: TreeNode[] =
  //           mode === 'datetime'
  //             ? hours.map((hour) => {
  //                 const hourDates = dayDates.filter((m) => m.hours() === hour);
  //                 const minutes = Array.from(new Set(hourDates.map((m) => m.minutes()))).sort(
  //                   (a, b) => a - b,
  //                 );
  //
  //                 const minuteNodes: TreeNode[] = minutes.map((minute) => ({
  //                   key: `${year}-${this.numberToString(month + 1)}-${this.numberToString(day)} ${this.numberToString(hour)}:${this.numberToString(minute)}`,
  //                   expanded: false,
  //                   data: { label: `${minute}`, type: 'minute', value: minute },
  //                   children: [],
  //                 }));
  //
  //                 return {
  //                   key: `${year}-${this.numberToString(month + 1)}-${this.numberToString(day)} ${this.numberToString(hour)}`,
  //                   expanded: false,
  //                   data: { label: `${hour}`, type: 'hour', value: hour },
  //                   children: minuteNodes,
  //                 };
  //               })
  //             : [];
  //
  //         return {
  //           key: `${year}-${this.numberToString(month + 1)}-${this.numberToString(day)}`,
  //           expanded: false,
  //           data: { label: `${day}`, type: 'day', value: day },
  //           children: hourNodes,
  //         };
  //       });
  //
  //       return {
  //         key: `${year}-${this.numberToString(month + 1)}`,
  //         expanded: false,
  //         data: {
  //           label: PRIMENG_RU.monthNames[month],
  //           type: 'month',
  //           value: month,
  //         },
  //         children: dayNodes,
  //       };
  //     });
  //
  //     return {
  //       key: `${year}`,
  //       expanded: false,
  //       data: { label: `${year}`, type: 'year', value: year },
  //       children: monthNodes,
  //     };
  //   });
  // }

  /**
   * Преобразование числа в строку с заданным количеством знакомест
   * @param value - исходное число
   * @param countChars - количество необходимых символов
   */
  numberToString(value: number, countChars: number = 2): string {
    return value.toString().padStart(countChars, '0');
  }

  /**
   * Получение минимальной и максимальной даты из выделенных nodes
   * @param selectedNodes - выделенные nodes дерева
   */
  // getDateRangeFromSelectedNodes(selectedNodes: TreeNode[]): string[] | null {
  //   if (!selectedNodes || selectedNodes.length === 0) return null;
  //
  //   // const allKeys = selectedNodes.map(node => node.key ?? '');
  //   return selectedNodes.map((node) => node.key ?? '');
  //   // return this.filterKeys(allKeys);
  // }

  /**
   * Определения квартала по дате
   * @param date - заданная дата
   * @private
   */
  // private getQuarterByDate(date: moment.Moment): IDateRange {
  //   const quarter = Math.floor(date.month() / 3) + 1;
  //
  //   switch (quarter) {
  //     case 1:
  //       return this.getFirstQuarter(date);
  //     case 2:
  //       return this.getSecondQuarter(date);
  //     case 3:
  //       return this.getThirdQuarter(date);
  //     case 4:
  //       return this.getFourthQuarter(date);
  //     default:
  //       return this.getFirstQuarter(date);
  //   }
  // }

  // /**
  //  * Создание метки для определения периодов сравнения
  //  * @param name - название выбранного периода отбора данных
  //  * @private
  //  */
  // private getTitleCompared(name: string) {
  //   if (name.includes(' год')) return 'год';
  //   if (name.includes('полугодие')) return 'полугодие';
  //   if (name.includes('квартал')) return 'квартал';
  //   if (name.includes('месяц')) return 'месяц';
  //   return null;
  // }
}
