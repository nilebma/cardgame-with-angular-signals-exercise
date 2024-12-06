import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of, retry, shareReplay, tap, timer } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export abstract class DataLoader<T> {
  protected abstract resourcePath: string; // abstract property must be implemented by the subclasses
  protected http = inject(HttpClient);
  protected maxRetries = 3;
  protected delayBetweenRetries = 1000;

  protected apiUrl = environment.apiUrl;
  protected apiKey = environment.apiKey;

  public httpRequestState = signal<'error' | 'loading' | 'loaded' | 'init'>('init');
  public httpRequestError = signal<string | null>(null);
  
  public state = computed(() => this.httpRequestState());
  public error = computed(() => this.httpRequestError());

  private data$ = new BehaviorSubject<T[]>([]);
  data: Signal<T[]> = toSignal(this.data$.asObservable(), { initialValue: [] as T[] });

  constructor() {
  }

  loadResources() {
    this.httpRequestState.set('loading');
    this.httpRequestError.set(null);

    const url = `${this.apiUrl}${this.resourcePath}`;
    console.log('loading resources from', url, this.resourcePath);
    this.http.get<T[]>(`${this.apiUrl}${this.resourcePath}`, {
                headers: new HttpHeaders({
                    'Authorization': `${this.apiKey}`,
                    'Content-Type': 'application/json'
                }),
                withCredentials: true
            }).pipe(
                tap(() => this.httpRequestState.set('loaded')),
                retry({
                    count: this.maxRetries,
                    delay: (error, retryCount) => {
                    this.httpRequestState.set('loading');
                    return timer(retryCount * this.delayBetweenRetries);
                    }
                }),
                catchError((error) => {
                    this.httpRequestState.set('error');
                    this.httpRequestError.set(error.message);
                    return of([]);
                }),
                shareReplay(1)
            ).subscribe(data => this.data$.next(data));

  }

  protected adaptResourceBeforeSave(resource:T):any {
    return resource;
  }

  async saveNewResource(resource:T) {

    this.httpRequestState.set('loading');
    if(this.adaptResourceBeforeSave)
      resource = this.adaptResourceBeforeSave(resource);

    try {
      const response = await firstValueFrom(this.http.post<T>(`${this.apiUrl}${this.resourcePath}`, resource, {
          headers: new HttpHeaders({
            'Authorization': `${this.apiKey}`,
            'Content-Type': 'application/json'
          })
        }))

      console.log('saveNewResource', response);
      this.httpRequestState.set('loaded');
      // this.data$.next([...this.data(), response]);
      return response;
    }
    catch(error) {
      throw error;
    }
  }
}
