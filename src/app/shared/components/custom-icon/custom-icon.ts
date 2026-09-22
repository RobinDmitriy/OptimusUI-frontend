import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { getIcon } from '../../utils';

@Component({
  selector: 'app-custom-icon',
  imports: [FaIconComponent],
  templateUrl: './custom-icon.html',
  styleUrl: './custom-icon.scss',
})
export class CustomIcon {
  name = input<string>('search');

  protected readonly getIcon = getIcon;
}
