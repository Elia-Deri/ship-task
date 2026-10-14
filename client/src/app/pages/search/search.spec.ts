import { NEVER } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Search } from './search';
import { SearchService } from '../../service/search';
import { SearchStream } from '../../service/search-stream';

describe('Search', () => {
  let fixture: ComponentFixture<Search>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SearchStream, useValue: { open: () => NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    await fixture.whenStable();
  });

  it('collapses the hero and shows results once a search starts', async () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('section.hero.compact')).toBeNull();

    TestBed.inject(SearchService).search({
      source: 'Haifa',
      destination: 'Rotterdam',
      startDate: Date.UTC(2026, 9, 14),
      endDate: Date.UTC(2026, 9, 20),
      supplierIds: [1],
    });
    await fixture.whenStable();

    expect(element.querySelector('section.hero.compact')).not.toBeNull();
    expect(element.querySelector('h1')).toBeNull();
    expect(element.querySelector('app-results li')).not.toBeNull();
  });
});
