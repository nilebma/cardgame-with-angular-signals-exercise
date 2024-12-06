import { computed, effect, Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { DataLoader } from '../../../core/abstract/data-loader';
@Injectable({
  providedIn: 'root'
})
export class PlayerService extends DataLoader<Player> {

  protected resourcePath = '/players';

  constructor() {
    super();
    this.loadResources();
  }
  
  playerById = computed(() => Object.fromEntries(this.data().map(player => [player.id, player])));

  debug = effect(() => {
    console.log("GameService | loaded players", this.data())
  });
}
