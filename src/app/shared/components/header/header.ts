import { Component, output } from '@angular/core';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { Select } from '@openng/optimus-ui/select';

@Component({
  selector: 'app-header',
  imports: [Toolbar, Select],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  selectedData = output<string | null>();

  protected variantData = ['Сотрудники', 'Автомобили'];

  /**
   * Обработка выбора данных для отображения
   * @param value - выбранное значение данных для отображения
   * @protected
   */
  protected onChangeVariantData(value: string | null) {
    console.log('Change variant data value = ', value);
    this.selectedData.emit(value);
  }
}
