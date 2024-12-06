import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from 'src/app/features/games/services/game.service';
import { PlayerService } from 'src/app/features/players/services/player.service';
import { ActivePlayer } from '../../classes/active-player';
import { PlayerDeckComponent } from '../player-deck/player-deck.component';
import { PlayerSelectorComponent } from '../player-selector/player-selector.component';
import { IonButton, AlertController } from '@ionic/angular/standalone';
import { GameState, PlayedCard } from '../../models/activegame.model';

/**
 * GameBoardComponent
 * This component presents the game board, where two players play the game.
 * It handles the game logic, card deck management, and game state management.
 */
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

  /** Alert controller service for displaying dialogs */
  private alertController = inject(AlertController);

  /** Player and Game services for data access */
  playerService = inject(PlayerService);
  gameService = inject(GameService);

  /** Size of the card deck (that should be even) */
  readonly deckSize:number = 52; 

  /** Player instances */
  firstActivePlayer:ActivePlayer;
  secondActivePlayer:ActivePlayer;
  
  // CONSTRUCTOR SECTION
  /** Initializes the active players and deals the card deck */
  constructor() { 
    this.firstActivePlayer = new ActivePlayer(this.gamesRounds);
    this.secondActivePlayer = new ActivePlayer(this.gamesRounds);
    this.firstActivePlayer.setOtherActivePlayer(this.secondActivePlayer);
    this.secondActivePlayer.setOtherActivePlayer(this.firstActivePlayer);
    this.dealCard();
  }

  // CARD DECK LOGIC SECTION
  // Generate the card deck, sorting, and deal it to the players
 
  /* Deals cards to both players by splitting the generated deck*/
  dealCard() {
    const cardDeck = this.generateCardDeck();
    const halfDeckSize = this.deckSize / 2;
    this.firstActivePlayer.setCardDeck(cardDeck.slice(0, halfDeckSize));
    this.secondActivePlayer.setCardDeck(cardDeck.slice(halfDeckSize, this.deckSize));
  }

  /** Generates and shuffles a new card deck */
  generateCardDeck():Array<number> {
    const cardDeck = [];

    for (let i = 1; i < this.deckSize + 1; i++) {
      cardDeck.push(i);
    }

    // We shuffle the deck
    cardDeck.sort(() => Math.random() - 0.5);
    
    return cardDeck;
  }

  // GAME LOGIC SECTION

  /** Each round is described by an array of played cards, only completed rounds are saved here */
  private gamesRounds = signal<Array<[PlayedCard, PlayedCard]>>([]);

  /** The card that has last been played by each player (first player, then second player) 
      If a card is null, it means that the corresponding player has not played their card in the current round */
  private currentHand:[number|null, number|null] = [null, null];

  /**
   * Effect that handles the game logic when cards are played
   * Manages turn order, card playing permissions, and round completion
   */
  private pickCardEffect = effect(() => {
    let newFirstPlayerCard = this.firstActivePlayer.currentCard();
    let newSecondPlayerCard = this.secondActivePlayer.currentCard();
    let currentFirstPlayerCard = this.currentHand[0];
    let currentSecondPlayerCard = this.currentHand[1];
    let firstPlayerCanPlay = true;
    let secondPlayerCanPlay = true;

    // If second player has not played their card yet, then first we just define that the first player can't play
    if(newFirstPlayerCard && !newSecondPlayerCard) {
        firstPlayerCanPlay = false;
    }
    // If first player has not played their card yet, then we define that the second player can't play
    else if(!newFirstPlayerCard && newSecondPlayerCard) {
        secondPlayerCanPlay = false;
    }
    // If both players have played their card
    else if(newFirstPlayerCard && newSecondPlayerCard) {

      // If both players already had card on the table, then it means that it is a start of a new round
      if(currentFirstPlayerCard && currentSecondPlayerCard)
      {
        // If the first player has started the new round
        if(currentFirstPlayerCard != newFirstPlayerCard)
        {
          // Then we expect the second player to play their card, and we clear their hand
          this.secondActivePlayer.removeCurrentCardFromHand(); 
          firstPlayerCanPlay = false;
        }

        // If the second player has started the new round
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
      }
    }

    // Before updating "canplaystatus" for each player, we check if they still have cards in their deck (if not, they can't play for sure)
    firstPlayerCanPlay = firstPlayerCanPlay && this.firstActivePlayer.cardDeck().length > 0;
    secondPlayerCanPlay = secondPlayerCanPlay && this.secondActivePlayer.cardDeck().length > 0;

    // We update the "canplaystatus" for each player
    this.firstActivePlayer.updateCanPlayStatus(firstPlayerCanPlay);
    this.secondActivePlayer.updateCanPlayStatus(secondPlayerCanPlay);

    // We update the current hand copy of the players that we hold in that component to know the last card played
    this.currentHand = [newFirstPlayerCard, newSecondPlayerCard];
    
  }, {allowSignalWrites: true});
  

  // GAME STATE SECTION
  // Here we handle the game state, which can be :
  // - playerSelection : when the players are not selected
  // - onGoing : when the game is in progress
  // - over : when the game is over
  // - saved : when the game is saved

  /** Computed signal that determines the current game state */
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

  /** Event emitter for game state changes */
  gameStateEmitter = output<GameState>({ alias: 'gameState' });

  /** Effect that emits game state changes */
  gameStateEmitterEffect = effect(() => {
    this.gameStateEmitter.emit(this.gameState());
  });

  /** Computed Signal calculating the name of the winner */
  winnerName:Signal<string | null> = computed(() => {
    if(this.firstActivePlayer.isWinning())
      return this.firstActivePlayer.name();
    else if(this.secondActivePlayer.isWinning())
      return this.secondActivePlayer.name();
    else  
      return 'Draw';
  });

  // GAME SAVING SECTION
  // Here we handle the game saving to the database (via the game service)

  /** Indicates if the game is saved */
  private gameSaved = signal(false);

  /** Saves the game to the database */
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

  /** Displays an error alert for game saving */
  async displaySaveGameError(error:any) {
    const alert = await this.alertController.create({
      header: 'Erreur lors de la sauvegarde de la partie',
      message: error.message,
      buttons: ['OK']
    });
    await alert.present();
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



}
