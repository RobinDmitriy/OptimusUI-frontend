const FORMAT_TOKENS = ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss'] as const;
type FormatToken = (typeof FORMAT_TOKENS)[number];

const TOKEN_REGEX = /YYYY|MM|DD|HH|mm|ss/g;

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

/**
 * Преобразование даты в строку
 * @param date - значение даты
 * @param format - формат отображения даты
 */
export function dateToString(date?: Date | null, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const values: Record<FormatToken, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return format.replace(TOKEN_REGEX, (token) => values[token as FormatToken] ?? token);
}

/**
 * Преобразование строки в дату
 * @param date - дата в формате строки
 * @param format - формат даты
 * @param isEnd - признак преобразования окончания периода
 */
export function stringToDate(
  date?: string,
  format: string = 'YYYY-MM-DD HH:mm:ss',
  isEnd = false,
): Date {
  if (!date) {
    console.error('Ошибка!!! Не правильно указан формат даты в функции "stringToDate"');
    return new Date();
  }

  if (isEnd) {
    date = `${date} 23:59:59`;
  }

  const tokens = format.match(TOKEN_REGEX) ?? [];

  const parts = date.split(/\D+/).filter(Boolean);

  const values: Partial<Record<FormatToken, number>> = {};
  tokens.forEach((token, index) => {
    values[token as FormatToken] = Number.parseInt(parts[index] ?? '0', 10);
  });

  return new Date(
    values.YYYY ?? 1970,
    (values.MM ?? 1) - 1,
    values.DD ?? 1,
    values.HH ?? 0,
    values.mm ?? 0,
    values.ss ?? 0,
  );
}

/**
 * Проверка принадлежности элемента шаблона к p-date-picker
 * @param target - элемент шаблона
 */
export function isDatePicker(target: HTMLElement): boolean {
  return !!target.closest(
    '.p-datepicker-panel, .p-datepicker, .p-calendar, .p-datepicker-title, .p-datepicker-select-month, .p-datepicker-month, .p-datepicker-select-year, .p-datepicker-year',
  );
}
