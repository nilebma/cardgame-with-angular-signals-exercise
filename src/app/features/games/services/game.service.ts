import { computed, effect, inject, Injectable, Signal } from '@angular/core';
import { PlayerService } from '../../players/services/player.service';
import { GameRaw, Game, ScoreRaw } from '../models/game.model';
import { DataLoader } from '../../../core/abstract/data-loader';

@Injectable({
  providedIn: 'root'
})
export class GameService extends DataLoader<GameRaw> {

  private playerService = inject(PlayerService);
  protected resourcePath = '/games';
  public override state = computed(() => {
    if(this.playerService.state() !== 'loaded' && this.httpRequestState() === 'loaded')
      return 'loading';
    else
      return this.httpRequestState();
  });

  constructor() {
    super();
    this.loadResources();
  }

  gamesWithPlayerNames: Signal<Game[]> = computed(() => {

    if(this.state() !== 'loaded')
      return [];

    return this.data().map(game => ({
      ...game,
      scores: game.scores.map(score => ({
       ...score,
        winner: score.score === Math.max(...game.scores.map(s => s.score)),
        playerName: this.playerService.playerById()[score.playerId]?.name || ''
      }))
    })).reverse();

  });
  
  debug = effect(() => {
    console.log("GameService | loaded games", this.gamesWithPlayerNames())
  });

  protected override adaptResourceBeforeSave(resource:GameRaw):Array<ScoreRaw> {
    return resource.scores || [];
  }

  async saveGame(game:GameRaw) {
    return this.saveNewResource(game);
  }
}
