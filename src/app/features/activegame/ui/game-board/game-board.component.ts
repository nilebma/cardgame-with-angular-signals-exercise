import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from 'src/app/features/games/services/game.service';
import { PlayerService } from 'src/app/features/players/services/player.service';
import { ActivePlayer } from '../../classes/active-player';
import { PlayerDeckComponent } from '../player-deck/player-deck.component';
import { PlayerSelectorComponent } from '../player-selector/player-selector.component';
import { IonButton, AlertController } from '@ionic/angular/standalone';
import { GameState, PlayedCard } from '../../models/activegame.model';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss'],
  standalone: true,
  imports: [IonButton, 
            CommonModule,
            FormsModule,
            PlayerDeckComponent,
            PlayerSelectorComponent]
})
export class GameBoardComponent  {

  private alertController = inject(AlertController);
  playerService = inject(PlayerService);
  gameService = inject(GameService);

  
  readonly deckSize:number = 4; // should be even
  firstActivePlayer:ActivePlayer;
  secondActivePlayer:ActivePlayer;

  private gamesRounds = signal<Array<[PlayedCard, PlayedCard]>>([]);
  private currentHand:[number|null, number|null] = [null, null];
  
  constructor() { 
    this.firstActivePlayer = new ActivePlayer(this.gamesRounds);
    this.secondActivePlayer = new ActivePlayer(this.gamesRounds);
    this.firstActivePlayer.setOtherActivePlayer(this.secondActivePlayer);
    this.secondActivePlayer.setOtherActivePlayer(this.firstActivePlayer);
    this.dealCard();
  }

  // Debugging 
  // private deckEffect = effect(() => {
  //   console.log('deck', {
  //     player1Deck: this.firstActivePlayer.cardDeck(),
  //     player1CurrentCard: this.firstActivePlayer.currentCard(),
  //     player1CanPlay: this.firstActivePlayer.canPlay(),
  //     player2Deck: this.secondActivePlayer.cardDeck(),
  //     player2CurrentCard: this.secondActivePlayer.currentCard(),
  //     player2CanPlay: this.secondActivePlayer.canPlay()
  //   });
  // });

  // Card deck Logic : Generate the card deck, sorting, and deal it to the players
 
  dealCard() {
    const cardDeck = this.generateCardDeck();
    const halfDeckSize = this.deckSize / 2;
    this.firstActivePlayer.setCardDeck(cardDeck.slice(0, halfDeckSize));
    this.secondActivePlayer.setCardDeck(cardDeck.slice(halfDeckSize, this.deckSize));
  }

  generateCardDeck():Array<number> {
    const cardDeck = [];

    for (let i = 1; i < this.deckSize + 1; i++) {
      cardDeck.push(i);
    }

    // We shuffle the deck
    cardDeck.sort(() => Math.random() - 0.5);
    
    return cardDeck;
  }

  // Game Logic : Here we have all the logic of the game, we handle cards by players, close and open rounds, and we save the round results

  private pickCardEffect = effect(() => {
    let newFirstPlayerCard = this.firstActivePlayer.currentCard();
    let newSecondPlayerCard = this.secondActivePlayer.currentCard();
    let currentFirstPlayerCard = this.currentHand[0];
    let currentSecondPlayerCard = this.currentHand[1];
    let firstPlayerCanPlay = true;
    let secondPlayerCanPlay = true;

    if(newFirstPlayerCard && !newSecondPlayerCard) {
        firstPlayerCanPlay = false;
    }
    else if(!newFirstPlayerCard && newSecondPlayerCard) {
        secondPlayerCanPlay = false;
    }
    else if(newFirstPlayerCard && newSecondPlayerCard) {

      // If both players already had card on the table, then it means that it is a start of a new round
      if(currentFirstPlayerCard && currentSecondPlayerCard)
      {
        // It means that the first player has started the new round
        if(currentFirstPlayerCard != newFirstPlayerCard)
        {
          // Then we expect the second player to play their card, and we clear their hand
          this.secondActivePlayer.removeCurrentCardFromHand(); 
          firstPlayerCanPlay = false;
        }

        // It means that the second player has started the new round
        if(currentSecondPlayerCard != newSecondPlayerCard)
        {
          // Then we expect the first player to play their card, and we clear their hand
          this.firstActivePlayer.removeCurrentCardFromHand();
          secondPlayerCanPlay = false;
        }
      }
      // ELSE it means that the round just got completed, and we can save its result
      else
      {
        if(this.firstActivePlayer.id() && this.secondActivePlayer.id())
        {
          this.gamesRounds.update(cardFights => [...cardFights, [
            {playerId: this.firstActivePlayer.id()!, card: newFirstPlayerCard}, 
            {playerId: this.secondActivePlayer.id()!, card: newSecondPlayerCard}]
          ]);
        }
        // Note that we don't empty the hands of the players, so they can see the card they played while waiting for the next round
      }
    }

    firstPlayerCanPlay = firstPlayerCanPlay && this.firstActivePlayer.cardDeck().length > 0;
    secondPlayerCanPlay = secondPlayerCanPlay && this.secondActivePlayer.cardDeck().length > 0;
    this.firstActivePlayer.updateCanPlayStatus(firstPlayerCanPlay);
    this.secondActivePlayer.updateCanPlayStatus(secondPlayerCanPlay);
    this.currentHand = [newFirstPlayerCard, newSecondPlayerCard];
    
  }, {allowSignalWrites: true});
  


  // Game state
  gameState:Signal<GameState> = computed(() => {
    if(this.gameSaved())
      return 'saved';
    else if(this.firstActivePlayer.cardDeck().length === 0 && this.secondActivePlayer.cardDeck().length === 0)
      return 'over';
    else if(this.firstActivePlayer.id() !== null && this.secondActivePlayer.id() !== null)
      return 'onGoing';
    else
      return 'playerSelection';
  });

  gameStateEmitter = output<GameState>({ alias: 'gameState' });
  gameStateEmitterEffect = effect(() => {
    this.gameStateEmitter.emit(this.gameState());
  });

  winnerName:Signal<string | null> = computed(() => {
    if(this.firstActivePlayer.isWinning())
      return this.firstActivePlayer.name();
    else if(this.secondActivePlayer.isWinning())
      return this.secondActivePlayer.name();
    else  
      return 'Draw';
  });

  private gameSaved = signal(false);

  // Game saving to the database
  async saveGame() {
    try {
      await this.gameService.saveGame({ 
          scores: [
          { 
            playerId: this.firstActivePlayer.id() || 0,
            score: this.firstActivePlayer.score() || 0
          },
          { 
            playerId: this.secondActivePlayer.id() || 0,
            score: this.secondActivePlayer.score() || 0 
          }
        ]
      });

      this.gameSaved.set(true);
    }
    catch(error) {
      console.error('ActivegamePage | saveGame', error);
      this.displaySaveGameError(error);
    }
  }

  async displaySaveGameError(error:any) {
    const alert = await this.alertController.create({
      header: 'Erreur lors de la sauvegarde de la partie',
      message: error.message,
      buttons: ['OK']
    });
    await alert.present();
  }


}
