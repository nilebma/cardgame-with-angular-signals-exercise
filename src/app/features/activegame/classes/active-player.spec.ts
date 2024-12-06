import { PlayedCard } from '../models/activegame.model';
import { ActivePlayer } from './active-player';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ActivePlayer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  });

  it('should create an instance', () => {
    TestBed.runInInjectionContext(() => {
      const gamesRounds = signal<Array<[PlayedCard, PlayedCard]>>([]);
      expect(new ActivePlayer(gamesRounds)).toBeTruthy();
    });
  });
});
