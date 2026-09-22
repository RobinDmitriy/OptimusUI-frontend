import {Component, input} from '@angular/core';

@Component({
  selector: 'app-color-view',
  imports: [],
  templateUrl: './color-view.html'
})
export class ColorView {
  color = input<string>('#ffffff');
}
