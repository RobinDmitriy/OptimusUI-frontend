import { Component, computed, inject, input } from '@angular/core';
import { CustomTable } from '../table/custom-table';
import { TestDataService } from '../../services';

@Component({
  imports: [CustomTable],
  selector: 'app-active-data',
  styleUrl: './active-data.css',
  templateUrl: './active-data.html',
})
export class ActiveData {
  selectedData = input<string | null>(null);

  private testDataService = inject(TestDataService);

  title = computed(() => this.selectedData() ?? '');
  data = computed(() => this.testDataService.getData(this.selectedData()));
  columns = computed(() => {
    return this.testDataService.getColumns(this.selectedData()) ?? undefined;
  });
}
