import { Component, computed, inject } from '@angular/core';

import { Hero } from './hero/hero';
import { Results } from './results/results';
import { SearchService } from '@/app/service/search';
import { SearchForm } from './search-form/search-form';

@Component({
  imports: [Hero, Results, SearchForm],
  selector: 'app-search',
  templateUrl: './search.html',
})
export class Search {
  private readonly searchService = inject(SearchService);

  protected readonly hasSearched = computed(() => this.searchService.request() !== null);
}
