import { inject, Service } from '@angular/core';
import { defer, map, mergeMap, Observable } from 'rxjs';
import { HttpClient, HttpEventType } from '@angular/common/http';

import { createSseDataReader } from './sse';
import { parseSearchEvent, SearchEvent, SearchRequest } from '@/app/models/search';

@Service()
export class SearchStream {
  private readonly http = inject(HttpClient);

  open(request: SearchRequest): Observable<SearchEvent> {
    // defer gives every subscription its own reader, so the consumed offset never leaks between searches.
    return defer(() => {
      const readSseData = createSseDataReader();

      return this.http
        .post('/searches', request, {
          observe: 'events',
          reportProgress: true,
          responseType: 'text',
        })
        .pipe(
          mergeMap((event) => {
            if (event.type === HttpEventType.DownloadProgress) {
              return readSseData(event.partialText ?? '');
            }
            if (event.type === HttpEventType.Response) {
              return readSseData(event.body ?? '');
            }
            return [];
          }),
          map((data) => parseSearchEvent(JSON.parse(data))),
        );
    });
  }
}
