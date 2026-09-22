import { Component, input, OnDestroy, OnInit, output } from '@angular/core';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { FormsModule } from '@angular/forms';
import { AutoFocus } from '@openng/optimus-ui/autofocus';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import { stringToDate } from '../../../utils';

@Component({
  selector: 'app-input-range',
  imports: [InputNumber, FormsModule, AutoFocus, DatePicker],
  templateUrl: './input-range.html',
  styleUrl: './input-range.scss',
})
export class InputRange implements OnInit, OnDestroy {
  isNumber = input<boolean>(true);
  inputText = input<string | null>(null);
  formatHour = input<string | null>(null);

  minValue: number | Date | null = null;
  maxValue: number | Date | null = null;
  rangeValue = output<any[]>();

  /**
   * Инициализация исходных данных компоненты
   */
  ngOnInit() {
    const inputValue = this.inputText();
    if (inputValue) {
      const values = inputValue.split(' - ');
      this.minValue = this.getValue(values[0], this.isNumber());
      this.maxValue = this.getValue(values[1], this.isNumber());
    }
  }

  ngOnDestroy() {
    this.rangeValue.emit([this.minValue, this.maxValue]);
  }

  /**
   * Обработка нажатия мыши на этой компоненте
   * @param event - данные события мыши
   */
  onComponentClick(event: MouseEvent) {
    event.stopPropagation();
  }

  /**
   * Преобразование значения из текста в заданный тип
   * @param valueText - текстовое значение
   * @param isNumber - признак преобразования в число
   * @private
   */
  private getValue(valueText: string, isNumber: boolean) {
    if (valueText.trim().length > 0) {
      return isNumber ? parseInt(valueText) : stringToDate(valueText, 'DD.MM.YYYY HH:mm:ss');
    } else {
      return null;
    }
  }
}
