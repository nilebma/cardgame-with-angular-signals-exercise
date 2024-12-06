import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of, retry, shareReplay, tap, timer } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export abstract class DataLoader<T> {
  protected http = inject(HttpClient);
  
  // api settings
  protected apiUrl = environment.apiUrl;
  protected apiKey = environment.apiKey;
  protected abstract resourcePath: string; // abstract property to be implemented by the subclasses

  // retry settings
  protected maxRetries = 3; 
  protected delayBetweenRetries = 1000;

  // communicate loading state
  public httpRequestState = signal<'error' | 'loading' | 'loaded' | 'init'>('init');
  public httpRequestError = signal<string | null>(null);
  public state = computed(() => this.httpRequestState()); // to be overridden by subclasses, otherwise it will return the httpRequestState
  public error = computed(() => this.httpRequestError()); // to be overridden by subclasses, otherwise it will return the httpRequestError

  // the data, accessible as a signal
  private data$ = new BehaviorSubject<T[]>([]);
  data: Signal<T[]> = toSignal(this.data$.asObservable(), { initialValue: [] as T[] });

  // to be overridden by subclasses, if needed, in order to adapt the resource before saving it
  protected adaptResourceBeforeSave(resource:T):any {
    return resource;
  }

  // load the resources from the api
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

  // save a new resource to the api
  async saveNewResource(resource:T) {

    // potentially adapt the resource before saving it
    if(this.adaptResourceBeforeSave)
      resource = this.adaptResourceBeforeSave(resource);

    try {
      // save the resource to the api
      const response = await firstValueFrom(this.http.post<T>(`${this.apiUrl}${this.resourcePath}`, resource, {
          headers: new HttpHeaders({
            'Authorization': `${this.apiKey}`,
            'Content-Type': 'application/json'
          })
        }))

      // the api returns the saved resource with an id, we update the data
      this.data$.next([...this.data(), response]);
      return response;
    }
    catch(error) {
      throw error;
    }
  }
}
