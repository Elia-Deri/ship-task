import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { SearchService } from '@/app/service/search';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-results',
  styleUrl: './results.css',
  templateUrl: './results.html',
})
export class Results {
  protected readonly search = inject(SearchService);

  protected readonly skeletons = computed(() =>
    Array.from({ length: this.search.pendingCount() }, (_, index) => index),
  );
}
