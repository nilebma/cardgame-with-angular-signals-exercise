import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { PlayerService } from '../../players/services/player.service';
import { environment } from 'src/environments/environment';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;
  let playerService: PlayerService;

  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ];

  const mockGames = [
    {
      id: 1,
      scores: [
        { playerId: 1, score: 10 },
        { playerId: 2, score: 5 }
      ]
    },
    {
      id: 2,
      scores: [
        { playerId: 1, score: 7 },
        { playerId: 2, score: 12 }
      ]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GameService, PlayerService]
    });

    service = TestBed.inject(GameService);
    playerService = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle the initial players request from PlayerService
    const playersReq = httpMock.expectOne(`${environment.apiUrl}/players`);
    playersReq.flush(mockPlayers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    
    // Handle the initial games request
    const req = httpMock.expectOne(`${environment.apiUrl}/games`);
    req.flush(mockGames);
  });

  it('should load games and calculate player names and winners for each game', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/games`);
    req.flush(mockGames);

    const gamesWithNames = service.gamesWithPlayerNames();
    
    expect(gamesWithNames[0].scores[0].playerName).toBe('Player 1');
    expect(gamesWithNames[0].scores[1].playerName).toBe('Player 2');
    expect(gamesWithNames[0].scores[0].winner).toBeTrue();
    expect(gamesWithNames[0].scores[1].winner).toBeFalse();

    expect(gamesWithNames[1].scores[0].playerName).toBe('Player 1');
    expect(gamesWithNames[1].scores[1].playerName).toBe('Player 2');
    expect(gamesWithNames[1].scores[0].winner).toBeFalse();
    expect(gamesWithNames[1].scores[1].winner).toBeTrue();
  });

  it('should handle http error', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/games`);
    req.error(new ErrorEvent('Network error'), {
      status: 404,
      statusText: 'Not Found'
    });

    expect(service.data()).toEqual([]);
  });
});