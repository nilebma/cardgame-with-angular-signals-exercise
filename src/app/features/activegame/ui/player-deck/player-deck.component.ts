import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, model, OnInit, output, signal, Signal } from '@angular/core';
import { GameState } from 'src/app/activegame/activegame.page';
import { ActivePlayer, Player } from 'src/app/features/players/models/player.model';
import { IonButton } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-player-deck',
  templateUrl: './player-deck.component.html',
  styleUrls: ['./player-deck.component.scss'],
  standalone: true,
  imports: [IonButton, CommonModule, FormsModule, IonButton ]
})
export class PlayerDeckComponent  implements OnInit {

  player = input.required<ActivePlayer | null>();
  gameState = input.required<GameState>();
  pickCardEmitter = output<number | null>({
    alias: 'onPickCard'
  });

  private lastCardValue = null;

  lastCard = computed(() => {
    let valueToReturn = this.lastCardValue;
    let newCard = this.player()?.currentCard();
    this.lastCardValue = newCard !== null ? newCard : valueToReturn;
    return valueToReturn;
  });



  constructor() { 
  }

  pickCard() {
    this.pickCardEmitter.emit(this.player()?.currentCard());
    // const cardDeck = this.player()?.cardDeck();
    // this.player()?.currentCard.update((card:number) => cardDeck?.pop() || null);
    // this.player()?.cardDeck.update((deck:number[]) => [...deck]);
  }

  ngOnInit() {}

}
