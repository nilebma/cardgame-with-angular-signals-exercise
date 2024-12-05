import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, Observable, of, retry, shareReplay, tap, timer } from 'rxjs';
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

  public state = signal<'error' | 'loading' | 'loaded' | 'init'>('init');
  public loadingError = signal<string | null>(null);

  private data$ = new BehaviorSubject<T[]>([]);
  data: Signal<T[]> = toSignal(this.data$.asObservable(), { initialValue: [] as T[] });

  constructor() {
  }

  loadResources() {
    this.state.set('loading');
    this.loadingError.set(null);

    const url = `${this.apiUrl}${this.resourcePath}`;
    console.log('loading resources from', url, this.resourcePath);
    this.http.get<T[]>(`${this.apiUrl}${this.resourcePath}`, {
                headers: new HttpHeaders({
                    'Authorization': `${this.apiKey}`,
                    'Content-Type': 'application/json'
                }),
                withCredentials: true
            }).pipe(
                tap(() => this.state.set('loaded')),
                retry({
                    count: this.maxRetries,
                    delay: (error, retryCount) => {
                    this.state.set('loading');
                    return timer(retryCount * this.delayBetweenRetries);
                    }
                }),
                catchError((error) => {
                    this.state.set('error');
                    this.loadingError.set(error.message);
                    return of([]);
                }),
                shareReplay(1)
            ).subscribe(data => this.data$.next(data));

  }
}