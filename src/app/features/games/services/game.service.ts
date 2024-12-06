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

  constructor() {
    super();
    this.loadResources();
  }

  // we override the loading state as we wait for the players to be loaded
  public override state = computed(() => {
    if(this.playerService.state() !== 'loaded' && this.httpRequestState() === 'loaded')
      return 'loading';
    else
      return this.httpRequestState();
  });

  // we expose the different games by adding the the player names and winning status to the scores
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
    })).reverse(); // we reverse the order so that the most recent game is at the top

  });
  
  async saveGame(game:GameRaw) {
    return this.saveNewResource(game);
  }
  
  // we adapt the resource before saving it to the database, as api expects an array of scores
  protected override adaptResourceBeforeSave(resource:GameRaw):Array<ScoreRaw> {
    return resource?.scores || [];
  }
  
  // debug = effect(() => {
  //   console.log("GameService | loaded games", this.gamesWithPlayerNames())
  // });

}
