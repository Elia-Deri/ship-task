import { HttpInterceptorFn } from '@angular/common/http';

const API_URL = 'http://localhost:5298/api';

export const apiUrlInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.url.startsWith('/') ? request.clone({ url: `${API_URL}${request.url}` }) : request);
