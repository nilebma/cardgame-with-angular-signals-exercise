import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of, retry, shareReplay, tap, timer } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * Abstract generic class for loading and managing data from a REST API.
 * Provides basic functionality for loading, saving, and state management.
 * @template T - The type of data handled by the loader
 */
@Injectable({
  providedIn: 'root'
})
export abstract class DataLoader<T> {
  protected http = inject(HttpClient);
  
  /** API configuration */
  protected apiUrl = environment.apiUrl;
  protected apiKey = environment.apiKey;

  /** API resource path to be implemented by subclasses */
  protected abstract resourcePath: string;

  /** Retry configuration */
  protected maxRetries = 3; 
  protected delayBetweenRetries = 1000;

  /** Signals for HTTP request state management */
  public httpRequestState = signal<'error' | 'loading' | 'loaded' | 'init'>('init');
  public httpRequestError = signal<string | null>(null);
  /** Computed signal for state - can be overridden by subclasses, otherwise it will return the value of httpRequestState */
  public state = computed(() => this.httpRequestState());
  /** Computed signal for errors - can be overridden by subclasses, otherwise it will return the value of httpRequestError */
  public error = computed(() => this.httpRequestError());

  /** Main data stream and its associated signal */
  private data$ = new BehaviorSubject<T[]>([]);
  data: Signal<T[]> = toSignal(this.data$.asObservable(), { initialValue: [] as T[] });

  /**
   * Method to adapt a resource before saving.
   * Can be overridden by subclasses to modify data before sending it to the API.
   * @param resource - The resource to adapt
   * @returns The adapted resource
   */
  protected adaptResourceBeforeSave(resource: T): any {
    return resource;
  }

  /**
   * Loads resources from the API.
   * Automatically handles:
   * - Loading states
   * - Retry attempts on failure
   * - Simple Error management
   */
  loadResources() {
    this.httpRequestState.set('loading');
    this.httpRequestError.set(null);

    const url = `${this.apiUrl}${this.resourcePath}`;
    console.log('loading resources from', url, this.resourcePath);

    // Configure HTTP request with authentication headers
    this.http.get<T[]>(`${this.apiUrl}${this.resourcePath}`, {
                headers: new HttpHeaders({
                    'Authorization': `${this.apiKey}`,
                    'Content-Type': 'application/json'
                }),
                withCredentials: true
            }).pipe(
                // Update state once data is loaded
                tap(() => this.httpRequestState.set('loaded')),
                // Configure retry attempts with progressive delay
                retry({
                    count: this.maxRetries,
                    delay: (error, retryCount) => {
                    this.httpRequestState.set('loading');
                    return timer(retryCount * this.delayBetweenRetries);
                    }
                }),
                // Handle errors after retry attempts are exhausted
                catchError((error) => {
                    this.httpRequestState.set('error');
                    this.httpRequestError.set(error.message);
                    return of([]);
                }),
                // Cache the last result
                shareReplay(1)
            ).subscribe(data => this.data$.next(data));
  }

  /**
   * Saves a new resource to the API.
   * @param resource - The resource to save
   * @returns Promise containing the saved resource with its ID
   * @throws Error if saving fails
   */
  async saveNewResource(resource: T) {
    // Adapt the resource if necessary
    if(this.adaptResourceBeforeSave)
      resource = this.adaptResourceBeforeSave(resource);

    try {
      // Send POST request to the API
      const response = await firstValueFrom(this.http.post<T>(`${this.apiUrl}${this.resourcePath}`, resource, {
          headers: new HttpHeaders({
            'Authorization': `${this.apiKey}`,
            'Content-Type': 'application/json'
          })
        }))

      // Update local data with the new resource
      this.data$.next([...this.data(), response]);
      return response;
    }
    catch(error) {
      throw error;
    }
  }
}
