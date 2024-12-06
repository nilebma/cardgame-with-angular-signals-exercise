import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, NavController } from '@ionic/angular/standalone';
import { ActivePlayer, Player } from '../features/players/models/player.model';
import { PlayerService } from '../features/players/services/player.service';
import { AlertController } from '@ionic/angular';
import { PlayerDeckComponent } from '../features/activegame/ui/player-deck/player-deck.component';
import { PlayerSelectorComponent } from '../features/activegame/ui/player-selector/player-selector.component';
import { GameService } from '../features/games/services/game.service';

export type GameState = 'onGoing' | 'over' | 'playerSelection' | 'saved';

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

  // We initialize the players

  firstActivePlayer:ActivePlayer = {
    id: signal(null), // will be populated by the player selector component
    name: computed(() => {
      const playerId = this.firstActivePlayer.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    }),
    cardDeck: signal<number[]>([]), // will be populated by the dealCard method
    score: computed(() => this.gamesRounds().reduce((acc, fight) => 
      {
        if(fight[0] > fight[1]) {
          return acc + 1;
        }
        return acc;
      }, 0)
    ),
    potentialPlayers: computed(() => 
      this.playerService.data().filter(player => player.id !== this.secondActivePlayer.id())
    ),
    pickCard: () => { // will be called by the playerDeck component
      const cardDeck = this.firstActivePlayer.cardDeck();
      this.firstActivePlayer.currentCard.update((card:number) => cardDeck?.pop() || null);
      this.firstActivePlayer.cardDeck.update((deck:number[]) => [...cardDeck]);
    },
    currentCard: signal(null), // will be updated by the playerDeck component and the pickCard method
    canPlay: signal(true), // will be updated by the pickCardEffect
    isWinningRound: computed(() => {
      if(this.firstActivePlayer.currentCard() && this.secondActivePlayer.currentCard())
      {
        return this.firstActivePlayer.currentCard() > this.secondActivePlayer.currentCard();
      }
      return false;
    }),
    isWinning : computed(() => {
      if((this.firstActivePlayer.score() ?? 0) > (this.secondActivePlayer.score() || 0))
        return true;
      else 
        return false;
    })
  };

  secondActivePlayer:ActivePlayer = {
    id: signal(null), // will be populated by the player selector component
    name: computed(() => {
      const playerId = this.secondActivePlayer.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    }),
    cardDeck: signal<number[]>([]), // will be populated by the dealCard method
    score: computed(() => this.gamesRounds().reduce((acc, fight) => 
      {
        if(fight[0] < fight[1]) {
          return acc + 1;
        }
        return acc;
      }, 0)
    ),
    potentialPlayers: computed(() => 
      this.playerService.data().filter(player => player.id !== this.firstActivePlayer.id())
    ),
    pickCard: () => { // will be called by the playerDeck component
      const cardDeck = this.secondActivePlayer.cardDeck();
      this.secondActivePlayer.currentCard.update((card:number) => cardDeck?.pop() || null);
      this.secondActivePlayer.cardDeck.update((deck:number[]) => [...deck]);
    },
    currentCard: signal(null), // will be updated by the playerDeck component and the pickCard method
    canPlay: signal(true),
    isWinningRound: computed(() => {
      if(this.firstActivePlayer.currentCard() && this.secondActivePlayer.currentCard())
      {
        return this.firstActivePlayer.currentCard() < this.secondActivePlayer.currentCard();
      }
      return false;
    }),
    isWinning : computed(() => {
      if((this.secondActivePlayer.score() ?? 0) > (this.firstActivePlayer.score() || 0))
        return true;
      else 
        return false;
    })
  };

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
    this.firstActivePlayer.cardDeck.update((deck:number[]) => [...cardDeck.slice(0, 3)]);
    this.secondActivePlayer.cardDeck.update((deck:number[]) => [...cardDeck.slice(3, 6)]);
  }

  generateCardDeck():Array<number> {
    const cardDeck = [];
    for (let i = 1; i < 7; i++) {
      cardDeck.push(i);
    }
    cardDeck.sort(() => Math.random() - 0.5);
    return cardDeck;
  }

  // Game Logic : Here we have all the logic of the game, we handle cards by players, close and open rounds, and we save the round results
  private gamesRounds = signal<Array<[number, number]>>([]);
  private currentHand:[number|null, number|null] = [null, null];

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
        this.gamesRounds.update(cardFights => [...cardFights, [newFirstPlayerCard, newSecondPlayerCard]]);
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

  constructor() { 
    this.dealCard();
  }

  private gameSaved = signal(false);

  private goBackToHomePage() {
    this.navCtrl.navigateBack('/home');
  }

  async saveParty() {
    console.log('saveParty');
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
      console.error('saveParty', error);
      this.displaySavePartyError(error);
    }
  }

  async displaySavePartyError(error:any) {
    const alert = await this.alertController.create({
      header: 'Erreur lors de la sauvegarde de la partie',
      message: error.message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
