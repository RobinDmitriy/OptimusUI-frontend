import { Component, computed, inject, input } from '@angular/core';
import { Table } from '../table/table';
import { TestDataService } from '../../services';

@Component({
  imports: [Table],
  selector: 'app-active-data',
  styleUrl: './active-data.css',
  templateUrl: './active-data.html',
})
export class ActiveData {
  selectedData = input<string | null>(null);

  private testDataService = inject(TestDataService);

  data = computed(() => this.testDataService.getData(this.selectedData()));
  columns = computed(() => this.testDataService.getColumns(this.selectedData()));
}
