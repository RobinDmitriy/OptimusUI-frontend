import { Component, input, output, ViewChild } from '@angular/core';
import { Popover } from '@openng/optimus-ui/popover';
import { Button } from '@openng/optimus-ui/button';
import { OverlayBadge } from '@openng/optimus-ui/overlaybadge';

@Component({
  selector: 'app-header-column-filter-button',
  imports: [Button, OverlayBadge, Popover, Popover, Button, OverlayBadge],
  templateUrl: './header-column-filter-button.html',
  styleUrl: './header-column-filter-button.scss',
})
export class HeaderColumnFilterButton {
  @ViewChild('btn') button!: Button;
  @ViewChild('popover') popover!: Popover;

  field = input.required<string>();
  count = input<number>(0);

  onClick = output<MouseEvent>();

  /**
   * Обработка события нажатия на кнопку множественного выбора для фильтрации
   * @param event - данные события нажатия на кнопку
   */
  onButtonClick(event: MouseEvent) {
    this.onClick.emit(event);
    this.popover.show(event, this.button.el.nativeElement);
  }

  /**
   *   Метод для программного скрытия popover из вне компоненты
   */
  hidePopover() {
    this.popover.hide();
  }
}
