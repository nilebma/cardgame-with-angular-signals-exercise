import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerService } from './player.service';
import { environment } from '@environments/environment';
import { provideHttpClient } from '@angular/common/http';

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlayerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();

    // Handle the initial HTTP request that loads players
    const req = httpMock.expectOne(`${environment.apiUrl}/players`);
    req.flush(mockPlayers);
  });

  it('should load players on init', () => {
    // Initial state should be loading
    expect(service.state()).toBe('loading');

    // Respond to the initial HTTP request
    const req = httpMock.expectOne(`${environment.apiUrl}/players`);
    req.flush(mockPlayers);

    // Check final state
    expect(service.state()).toBe('loaded');
    expect(service.data()).toEqual(mockPlayers);
  });

  it('should update playerById computed signal', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/players`);
    req.flush(mockPlayers);

    const playerMap = service.playerById();
    expect(playerMap[1]).toEqual(mockPlayers[0]);
    expect(playerMap[2]).toEqual(mockPlayers[1]);
  });

  it('should handle http error and retry', fakeAsync(() => {
    // Initial request fails with 503
    const firstReq = httpMock.expectOne(`${environment.apiUrl}/players`);
    firstReq.flush('Service Unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });

    expect(service.state()).toBe('loading');

    // Should retry automatically
    // we wait for 2000ms
    tick(service['delayBetweenRetries']);
    const retryReq = httpMock.expectOne(`${environment.apiUrl}/players`);
    retryReq.flush(mockPlayers); // Success on retry

    expect(service.state()).toBe('loaded');
    expect(service.data()).toEqual(mockPlayers);
  }));
});
