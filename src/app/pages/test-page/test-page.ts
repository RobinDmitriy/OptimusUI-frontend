import { Component, signal } from '@angular/core';
import { Header } from '../../shared/components';
import { ActiveData } from '../../shared/components/active-data/active-data';

@Component({
  imports: [Header, ActiveData],
  selector: 'app-test-page',
  styleUrl: './test-page.css',
  templateUrl: './test-page.html',
})
export class TestPage {
  selectedData = signal<string | null>(null);
}
