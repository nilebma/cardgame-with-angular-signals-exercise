import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, model, OnInit, output, signal, Signal } from '@angular/core';
import { GameState } from 'src/app/activegame/activegame.page';
import { IonButton } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ActivePlayer } from '../../classes/active-player';
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
  pickCardEmitter = output({
    alias: 'onPickCard'
  });

  private lastCardValue:any = null;

  lastCard = computed(() => {
    let valueToReturn = this.lastCardValue;
    let newCard = this.player()?.currentCard();
    this.lastCardValue = newCard !== null ? newCard : valueToReturn;
    return valueToReturn;
  });

  constructor() { 
  }

  pickCard() {
    this.pickCardEmitter.emit();
  }

  ngOnInit() {}

}
