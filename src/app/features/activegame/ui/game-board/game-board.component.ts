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

/**
 * GameBoardComponent
 * This component presents the game board, where two players play the game.
 * It handles the game logic, card deck management, and game state management.
 * @class
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

  /** 
   * Alert controller service for displaying dialogs 
   * @private
   */
  private alertController = inject(AlertController);

  /** Player service for player data access */
  playerService = inject(PlayerService);

  /** Game service for game data access */
  gameService = inject(GameService);

  /** 
   * Size of the card deck (that should be even)
   * @readonly
   * @type {number}
   */
  readonly deckSize:number = 4; 

  /** 
   * First active player instance
   * @type {ActivePlayer}
   */
  firstActivePlayer:ActivePlayer;

  /** 
   * Second active player instance
   * @type {ActivePlayer}
   */
  secondActivePlayer:ActivePlayer;

  /** 
   * Signal holding the array of played card pairs for score calculation
   * @private
   * @type {Signal<Array<[PlayedCard, PlayedCard]>>}
   */
  private gamesRounds = signal<Array<[PlayedCard, PlayedCard]>>([]);

  /** 
   * Current hand of the players
   * @private
   * @type {[number|null, number|null]}
   */
  private currentHand:[number|null, number|null] = [null, null];
  
  /**
   * Constructor
   * Initializes the active players and deals the card deck
   */
  constructor() { 
    this.firstActivePlayer = new ActivePlayer(this.gamesRounds);
    this.secondActivePlayer = new ActivePlayer(this.gamesRounds);
    this.firstActivePlayer.setOtherActivePlayer(this.secondActivePlayer);
    this.secondActivePlayer.setOtherActivePlayer(this.firstActivePlayer);
    this.dealCard();
  }
  // Card deck Logic : Generate the card deck, sorting, and deal it to the players
 
  /**
   * Deals cards to both players by splitting the generated deck
   * @returns {void}
   */
  dealCard() {
    const cardDeck = this.generateCardDeck();
    const halfDeckSize = this.deckSize / 2;
    this.firstActivePlayer.setCardDeck(cardDeck.slice(0, halfDeckSize));
    this.secondActivePlayer.setCardDeck(cardDeck.slice(halfDeckSize, this.deckSize));
  }

  /**
   * Generates and shuffles a new card deck
   * @returns {Array<number>} Shuffled array of card numbers
   */
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
  /**
   * Effect that handles the game logic when cards are played
   * Manages turn order, card playing permissions, and round completion
   * @private
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
  


  // Game state : Here we handle the game state, which can be :
  // - playerSelection : when the players are not selected
  // - onGoing : when the game is in progress
  // - over : when the game is over
  // - saved : when the game is saved
  /**
   * Computed signal that determines the current game state
   * @type {Signal<GameState>}
   */
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

  /**
   * Event emitter for game state changes
   * @type {OutputEmitterRef<GameState>}
   */
  gameStateEmitter = output<GameState>({ alias: 'gameState' });

  /**
   * Effect that emits game state changes
   */
  gameStateEmitterEffect = effect(() => {
    this.gameStateEmitter.emit(this.gameState());
  });

  /** 
   * Computed Signal calculating the name of the winner
   * @type {Signal<string | null>}
   */
  winnerName:Signal<string | null> = computed(() => {
    if(this.firstActivePlayer.isWinning())
      return this.firstActivePlayer.name();
    else if(this.secondActivePlayer.isWinning())
      return this.secondActivePlayer.name();
    else  
      return 'Draw';
  });

  // GAME SAVING SECTION
  /** 
   * Signal indicating if the game is saved
   * @private
   * @type {Signal<boolean>}
   */
  private gameSaved = signal(false);

  /**
   * Saves the game to the database
   * @async
   * @throws {Error} When saving fails
   * @returns {Promise<void>}
   */
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


  /**
   * Displays an error alert for game saving
   * @async
   * @param {any} error - The error object to display
   * @returns {Promise<void>}
   */
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
