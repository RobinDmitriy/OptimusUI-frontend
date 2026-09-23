import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
  ViewChild
} from '@angular/core';
import { Select } from '@openng/optimus-ui/select';
import { FormsModule } from '@angular/forms';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Menu } from '@openng/optimus-ui/menu';
import { CustomIcon } from '../../custom-icon/custom-icon';
import { NgClass } from '@angular/common';
import { ColorView } from '../color-view/color-view';
import { InputRange } from '../input-range/input-range';
import { FILTER_TYPE_ITEMS, IColumn, IFilterValue, IPossibleValue } from '../../../constants';
import { MenuItem } from '@openng/optimus-ui/api';
import { dateToString, isDatePicker } from '../../../utils';
import { IconField } from '@openng/optimus-ui/iconfield';
import { InputIcon } from '@openng/optimus-ui/inputicon';

@Component({
  selector: 'app-table-column-filter',
  imports: [
    Select,
    FormsModule,
    InputNumber,
    DatePicker,
    InputText,
    Menu,
    CustomIcon,
    NgClass,
    ColorView,
    InputRange,
    IconField,
    InputIcon,
  ],
  templateUrl: './table-column-filter.html',
  styleUrl: './table-column-filter.scss',
})
export class TableColumnFilter implements OnInit, OnDestroy {
  @ViewChild('menu') menu!: Menu;
  @ViewChild('inputNumber') inputNumber!: InputNumber;
  @ViewChild('inputText') inputTextRef!: ElementRef<HTMLInputElement>;
  @ViewChild('rangeContainer') rangeContainer!: ElementRef;

  column = input.required<IColumn>();
  filterValue = input<any>(null);
  options = input<IPossibleValue[]>([]);
  reset = input<boolean>(false);

  rangeValue = signal<string | null>(null);
  showRangeComponent = signal(false);
  value = signal<any>(null);
  isInputFocused = signal(false);
  filterChange = output<IFilterValue>();

  selectedRuleFilter: MenuItem = { label: 'Сбросить', icon: 'search' };

  hideTimeout: any;
  isMouseOverButton = false;
  isMouseOverMenu = false;
  // options: any[] = [];
  items: MenuItem[] | undefined;

  private isAlive = true;
  private renderer = inject(Renderer2);
  private menuMouseEnterListener: (() => void) | null = null;
  private menuMouseLeaveListener: (() => void) | null = null;
  private documentClickListener: (() => void) | null = null;

  constructor() {
    effect(() => {
      // console.log('effect column.type = ', this.column().type);
      if (this.reset()) {
        this.selectedRuleFilter = { label: 'Сбросить', icon: 'search' };

        // this.value.set(this.column().type === 'object' ? 0 : null);
        this.value.set(null);
        this.rangeValue.set(null);

        setTimeout(() => {
          if (this.inputNumber) {
            this.inputNumber.writeValue(null);
          }
        });
      }
    });
  }

  /**
   * Получение списка возможных значений
   */
  get getOptions() {
    const all = { value: 0, name: '(Все)' };
    return [all, ...this.options().filter((item) => !item.disabled)];
  }

  /**
   * Получение списка возможных значений цветов
   */
  get getColorOptions() {
    const all = { value: null, name: '(Все)' };
    return [all, ...this.options().filter((item) => !item.disabled)];
  }

  /**
   * Получение идентификатора меню поля фильтрации
   */
  get getMenuID() {
    const field = this.column()
      .field.replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/\^/g, '_');
    return `menu-${field}`;
  }

  /**
   * Проверка отсутствия правила фильтрация
   */
  get isResetFilterColumn(): boolean {
    return this.selectedRuleFilter.label === 'Сбросить';
  }

  /**
   * Инициализация формы
   */
  ngOnInit(): void {
    // if (this.column().optionLabel) {
      // const valueExpr = this.column().lookup?.valueExpr!;
      // const optionValue = this.column().lookup?.displayExpr!;
      // const all = {[valueExpr]: 0, [optionValue]: '(Все)'};
      // this.options = [all, ...this.column().lookup?.dataSource!];
      // this.value.set(this.filterValue() ?? 0);
    // } else {
      const typeColumn = this.column().type;
      if (typeColumn !== 'color') {
        this.items = FILTER_TYPE_ITEMS[typeColumn].map((item) => ({
          ...item,
          command: (event) => this.onChangeRuleFilters(event),
        }));
      }

      this.value.set(this.filterValue());
    // }
  }

  /**
   * После закрытия формы
   */
  ngOnDestroy() {
    this.isAlive = false;
    this.cleanupMenuListeners();
    this.removeDocumentClickListener();
  }

  /**
   * Обработка выбранного значения в поле фильтра
   * @param value - идентификатор выбранного элемента списка
   */
  onValueChange(value: number) {
    this.value.set(value);
    const matchMode = this.column().type === 'object[]' ? 'objectList' : 'objectByOptionValue';
    this.filterChange.emit({ value: value !== 0 ? [value] : null, matchMode });
  }

  /**
   * Обработка выбранного значения цвета в поле фильтра
   * @param color - код цвета в виде строки
   */
  onColorChange(color: string | null) {
    this.value.set(color);
    this.filterChange.emit({ value: color ? [color] : null, matchMode: 'in' });
  }

  /**
   * Добавляем обработчик клика по документу
   */
  openRangeComponent() {
    setTimeout(() => {
      this.documentClickListener = this.renderer.listen('document', 'click', (event: any) => {
        this.onDocumentClick(event);
      });
    });
  }

  /**
   * Удаляем обработчик клика по документу при закрытии компонента диапазона
   */
  closeRangeComponent() {
    this.removeDocumentClickListener();
  }

  /**
   * Наведение на кнопку — показываем меню
   * @param e - данные события мыши
   */
  onButtonEnter(e: MouseEvent) {
    if (!this.menu) return;

    this.isMouseOverButton = true;
    clearTimeout(this.hideTimeout);

    this.menu.show(e);

    setTimeout(() => {
      if (this.menu?.overlayVisible) {
        this.bindOverlayListeners();
      }
    }, 10);
  }

  /**
   * Уход с кнопки — проверяем, не ушли ли с меню
   */
  onButtonLeave() {
    this.isMouseOverButton = false;
    this.scheduleMenuHide();
  }

  /**
   * Наведение на меню — отменяем скрытие
   */
  onMenuEnter() {
    this.isMouseOverMenu = true;
    clearTimeout(this.hideTimeout);
  }

  /**
   * Уход с меню — возможно скрыть
   */
  onMenuLeave() {
    this.isMouseOverMenu = false;
    this.scheduleMenuHide();
  }

  /**
   * Если курсор ушёл и с меню, и с кнопки
   */
  scheduleMenuHide() {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      if (!this.isMouseOverButton && !this.isMouseOverMenu) {
        this.menu.hide();
      }
    }, 150); // Небольшая задержка для плавности
  }

  /**
   * Выбор правила отбора данных
   * @param e - данные события выбора правила отбора данных
   */
  onChangeRuleFilters(e: any) {
    const oldRule = this.selectedRuleFilter.id;
    this.selectedRuleFilter = e.item;
    // console.log('onChangeRuleFilters e = ', e);
    this.showRangeComponent.set('between' === e.item.id);
    if (this.showRangeComponent()) {
      this.openRangeComponent();
    } else if (oldRule === 'between') {
      this.rangeValue.set(null);
      this.closeRangeComponent();
    }

    setTimeout(() => {
      if (this.isResetFilterColumn) {
        this.value.set(null);
        if (this.inputNumber) {
          this.inputNumber.value = null;
        }
      } else {
        if (this.inputTextRef?.nativeElement) {
          this.inputTextRef.nativeElement.focus();
        } else if (this.inputNumber?.input?.nativeElement) {
          this.inputNumber.input.nativeElement.focus();
        }
      }
    });

    if (this.selectedRuleFilter.label === 'Сбросить') {
      this.filterChange.emit({ value: null, matchMode: 'startsWith' });
    } else {
      this.filterChange.emit({ value: this.value(), matchMode: e.item.id });
    }
  }

  /**
   * Обработка события активации фокуса в поле ввода
   */
  onInputFocus() {
    this.isInputFocused.set(true);
  }

  /**
   * Обработка события потери фокуса в поле ввода
   */
  onInputBlur() {
    this.isInputFocused.set(false);
  }

  /**
   * Обработка события ввода текста
   * @param event - данные события
   */
  onInputText(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value && target.value.length > 0 ? target.value : null;
    console.log('onInputText event = ', value);
    this.value.set(value);
    this.selectedRuleFilter = this.items?.find((item) => item.id === 'contains')!;
    setTimeout(() => {
      this.filterChange.emit({ value, matchMode: this.selectedRuleFilter.id! });
    }, 500);
  }

  /**
   * Обработка события ввода значения в поле ввода
   * @param value - значение введённых данных
   */
  onInputValue(value: string | number | null) {
    if (value !== null && this.isResetFilterColumn) {
      this.selectedRuleFilter = this.items?.find((item) => item.label === 'Равно')!;
    }

    this.value.set(this.selectedRuleFilter.id === 'in' && value ? [value] : value);
    setTimeout(() => {
      this.filterChange.emit({
        value: this.value(),
        matchMode: this.selectedRuleFilter.id!,
      });
    }, 500);
  }

  /**
   * Обработка события ввода даты
   * @param selectedDate - выбранная дата
   */
  onInputDatetime(selectedDate: Date) {
    console.log('onInputDatetime selectedDate = ', selectedDate);
    console.log('onInputDatetime this.selectedRuleFilter = ', this.selectedRuleFilter);
    if (selectedDate !== null && this.isResetFilterColumn) {
      this.selectedRuleFilter = this.items?.find((item) => item.label === 'Равно')!;
    }
    // this.value.set(this.selectedRuleFilter.id === 'in' && value ? [value] : value);
    this.value.set(selectedDate);
    setTimeout(() => {
      this.filterChange.emit({
        value: this.value(),
        matchMode: this.selectedRuleFilter.id!,
      });
    }, 500);
  }

  /**
   * Обработка нажатия на поле ввода диапазона значений
   * @param event - данные события нажатия на левую клавишу мыши
   */
  onClickInput(event: Event) {
    if (this.selectedRuleFilter.id === 'between') {
      event.stopPropagation();
      this.showRangeComponent.set(true);
      this.openRangeComponent();
    }
  }

  /**
   * Обновление отображения диапазона выбранных значений
   * @param rangeValues - массив из двух значений
   * @param type - тип данных
   */
  updateRangeValue(rangeValues: any[], type = 'number') {
    this.rangeValue.set(this.getStringFromRange(rangeValues, type));
    this.filterChange.emit({ value: rangeValues, matchMode: this.selectedRuleFilter.id! });
  }

  /**
   * Преобразование массива значений в строку
   * @param rangeValues - массив значений
   * @param type - тип данных
   * @private
   */
  private getStringFromRange(rangeValues: any[], type: string) {
    if (type === 'number') {
      return rangeValues.some((item) => item) ? rangeValues.join(' - ') : null;
    } else {
      if (rangeValues.some((item) => item == null)) return null;
      const format = type === 'date' ? 'DD.MM.YYYY' : 'DD.MM.YYYY HH:mm:ss';
      return rangeValues
        .map((item, i) => (item ? dateToString(rangeValues[i], format) : null))
        .join(' - ');
    }
  }

  /**
   * Привязка слушателей к overlay меню
   */
  private bindOverlayListeners() {
    if (!this.menu) return;

    try {
      this.unbindOverlayListeners();
      setTimeout(() => {
        const overlay = document.querySelector(`#${this.getMenuID}`) as HTMLElement;
        if (overlay) {
          this.menuMouseEnterListener = () => this.onMenuEnter();
          this.menuMouseLeaveListener = () => this.onMenuLeave();

          overlay.addEventListener('mouseenter', this.menuMouseEnterListener);
          overlay.addEventListener('mouseleave', this.menuMouseLeaveListener);
        }
      });
    } catch (error) {
      console.error('Error binding overlay listeners:', error);
    }
  }

  /**
   * Отвязка слушателей от overlay меню
   */
  private unbindOverlayListeners() {
    if (!this.menu) return;

    try {
      const overlay = document.querySelector(`#${this.getMenuID}`) as HTMLElement;
      if (overlay) {
        if (this.menuMouseEnterListener) {
          overlay.removeEventListener('mouseenter', this.menuMouseEnterListener);
        }
        if (this.menuMouseLeaveListener) {
          overlay.removeEventListener('mouseleave', this.menuMouseLeaveListener);
        }
      }
      this.menuMouseEnterListener = null;
      this.menuMouseLeaveListener = null;
    } catch (error) {
      console.error('Error binding overlay listeners:', error);
    }
  }

  /**
   * Обработка события нажатия на левую клавишу мыши
   * @param event - данные события мыши
   * @private
   */
  private onDocumentClick(event: MouseEvent) {
    if (!this.isAlive || !this.rangeContainer || !this.showRangeComponent()) return;

    const target = event.target as HTMLElement;
    const isInsideRangeComponent = this.rangeContainer.nativeElement.contains(target);

    if (!isInsideRangeComponent && !isDatePicker(target)) {
      this.showRangeComponent.set(false);
      this.closeRangeComponent();
    }
  }

  /**
   * Удаления слушателя события нажатия на левую кнопку мыши
   * @private
   */
  private removeDocumentClickListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }

  /**
   * Очистка событий привязанный к меню
   * @private
   */
  private cleanupMenuListeners() {
    this.unbindOverlayListeners();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
}
