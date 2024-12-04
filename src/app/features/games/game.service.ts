import { computed, effect, inject, Injectable, Signal } from '@angular/core';
import { PlayerService } from '../players/player.service';
import { GameRaw, Game } from './game.model';
import { DataLoader } from '../../core/abstract/ressource-loader';

@Injectable({
  providedIn: 'root'
})
export class GameService extends DataLoader<GameRaw> {

  private playerService = inject(PlayerService);
  protected resourcePath = '/games';

  constructor() {
    super();
    this.loadResources();
  }

  gamesWithPlayerNames: Signal<Game[]> = computed(() => {
    if(this.playerService.state() !== 'loaded')
      return [];

    return this.data().map(game => ({
      ...game,
      scores: game.scores.map(score => ({
        ...score,
        winner: score.score === Math.max(...game.scores.map(s => s.score)),
        playerName: this.playerService.playerById()[score.playerId]?.name || ''
      }))
    }))
  });
  
  debug = effect(() => {
    console.log("GameService | loaded games", this.gamesWithPlayerNames())
  });
}
