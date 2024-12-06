import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, NavController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { PlayerDeckComponent } from '../../features/activegame/ui/player-deck/player-deck.component';
import { PlayerSelectorComponent } from '../../features/activegame/ui/player-selector/player-selector.component';
import { GameService } from '../../features/games/services/game.service';
import { ActivePlayer } from '../../features/activegame/classes/active-player';
import { PlayerService } from '../../features/players/services/player.service';

export type GameState = 'onGoing' | 'over' | 'playerSelection' | 'saved';
export interface PlayedCard {
  playerId:number;
  card:number;
}

@Component({
  selector: 'app-activegame',
  templateUrl: './activegame.page.html',
  styleUrls: ['./activegame.page.scss'],
  standalone: true,
  imports: [IonContent,
            IonHeader,
            IonTitle,
            IonToolbar,
            CommonModule,
            FormsModule,
            IonButtons,
            IonBackButton,
            IonButton,
            PlayerSelectorComponent,
            PlayerDeckComponent]
})
export class ActivegamePage {

  playerService = inject(PlayerService);
  gameService = inject(GameService);
  alertController = inject(AlertController);
  private navCtrl = inject(NavController);
  // @HostListener('window:beforeunload', ['$event'])
  canDeactivate() {
    console.log("canDeactivate", this.gameState());
    return this.gameState() === 'playerSelection' || this.gameState() === 'saved';
  }

  async showExitDialog() {
    const alert = await this.alertController.create({
      header: 'Quitter la partie',
      message: 'Voulez-vous vraiment quitter la partie ?',
      buttons: [
        {
          text: 'Quitter',
          role: 'confirm',
        },
        {
          text: 'Annuler',
          role: 'cancel',
        }
      ]
    });
    await alert.present();
    return await alert.onDidDismiss();
  }
  
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
          this.secondActivePlayer.currentCard.set(null); 
          firstPlayerCanPlay = false;
        }

        // It means that the second player has started the new round
        if(currentSecondPlayerCard != newSecondPlayerCard)
        {
          // Then we expect the first player to play their card, and we clear their hand
          this.firstActivePlayer.currentCard.set(null);
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
    this.firstActivePlayer.canPlay.set(firstPlayerCanPlay);
    this.secondActivePlayer.canPlay.set(secondPlayerCanPlay);
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

  winnerName:Signal<string | null> = computed(() => {
    if(this.firstActivePlayer.isWinning())
      return this.firstActivePlayer.name();
    else if(this.secondActivePlayer.isWinning())
      return this.secondActivePlayer.name();
    else  
      return 'Draw';
  });

  private gameSaved = signal(false);

  private goBackToHomePage() {
    this.navCtrl.navigateBack('/home');
  }

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
      this.goBackToHomePage();
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
