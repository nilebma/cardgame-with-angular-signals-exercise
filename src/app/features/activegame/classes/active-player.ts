import { computed, effect, inject, signal, Signal } from "@angular/core";
import { PlayerService } from "../../players/services/player.service";
import { PlayedCard } from "../models/activegame.model";
import { Player } from "../../players/models/player.model";

/**
 * Represents an active player in the game.
 * This class is responsible for:
 * - Managing player data and logic during a game (deck, card, play status, score etc.)
 * - Holding and calculating useful data like player name, score, etc.
 */
export class ActivePlayer {

    // PLAYER SERVICE
    /** @private The player service injected for player data access */
    private playerService = inject(PlayerService);


    // CONSTRUCTOR
    // we inject the games rounds signal, that will be used to calculate the score
    /**
     * Creates an instance of ActivePlayer
     * @param gamesRounds - Signal containing the array of played card pairs for score calculation
     */
    constructor(public gamesRounds:Signal<Array<[PlayedCard, PlayedCard]>>) 
    {
    }


    // PLAYER ID
    // represents the unique identifier of the player that can be null at start

    /** @private Signal holding the player's ID */
    private _id = signal<number | null>(null);

    /** @readonly The player's ID as a readonly signal */
    public readonly id = this._id.asReadonly();

    /**
     * Sets the player's ID after type validation
     * @param id - The ID to set for the player
     */
    public setPlayerId(id:any) {
      if(typeof id === 'number' || id === null)
        this._id.set(id);
    }


    // OTHER PLAYER REFERENCE
    // sets the reference to the other player for score calculations

    /** @private The other active player reference */
    private otherActivePlayer:ActivePlayer | null = null;

    /**
     * Sets the other active player reference
     * @param otherActivePlayer - The other player instance
     */
    public setOtherActivePlayer(otherActivePlayer:ActivePlayer) 
    {
        this.otherActivePlayer = otherActivePlayer;
    }


    // CARD DECK
    // represents the deck of cards that the player has

    /** @private Signal containing the player's card deck */
    private _cardDeck = signal<number[]>([]);

    /** @readonly The player's card deck as a readonly signal */
    public readonly cardDeck = this._cardDeck.asReadonly();

    /**
     * Sets the player's card deck
     * @param cardDeck - Array of cards to assign to the player
     */
    public setCardDeck(cardDeck:number[]) {
        this._cardDeck.set(cardDeck);
    }
  

    // CURRENT CARD
    // represents the card that the player has picked for the current round

    /** @private Signal for the currently selected card */
    private _currentCard = signal<number | null>(null);

    /** @readonly The current card as a readonly signal */
    public readonly currentCard = this._currentCard.asReadonly();

    /** Removes the current card from player's hand after round completion */
    public removeCurrentCardFromHand() {
      this._currentCard.set(null);
    }


    // CAN PLAY
    // define if the player can play a card in the current round

    /** @private Signal indicating if the player can play */
    private _canPlay = signal<boolean>(true);

    /** @readonly The player's ability to play as a readonly signal */
    public readonly canPlay = this._canPlay.asReadonly();

    /**
     * Updates the player's ability to play
     * @param canPlay - Boolean indicating if the player can play
     */
    public updateCanPlayStatus(canPlay:boolean) {
      this._canPlay.set(canPlay);
    }


    // PLAYER NAME
    // gets the name of the current player by looking it up in the player service
    /** @readonly Computed signal that returns the player's name */
    public readonly name = computed<string | null>(() => {
      const playerId = this.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    });

    // PLAYER SCORE
    // calculates the score of the current player by counting won rounds
    /** @readonly Computed signal that returns the player's current score */
    public readonly score = computed<number>(() => this.gamesRounds().reduce((acc, fight) => 
      {
        const activePlayerCard = fight.find(card => card.playerId === this.id());
        const otherPlayerCard = fight.find(card => card.playerId !== this.id());
        if(activePlayerCard && otherPlayerCard && activePlayerCard.card > otherPlayerCard.card) {
          return acc + 1;
        }
        return acc;
      }, 0)
    );

    // POTENTIAL PLAYERS
    // gets the list of players that can be selected, excluding the other active player
    /** @readonly Computed signal that returns available players for selection */
    public readonly potentialPlayers = computed<Player[]>(() => {
      if(this.otherActivePlayer) 
      {
        return this.playerService.data().filter(player => player.id !== (this.otherActivePlayer as ActivePlayer).id());
      }
      return [];
    });

    // ROUND STATUS
    // determines if the current player is winning the current round
    /** @readonly Computed signal indicating if player is winning the current round */
    public readonly isWinningRound = computed<boolean>(() => {
      // it is important to check if both players have a card on the table (otherwise no winner)
      if(this.currentCard() && this.otherActivePlayer?.currentCard())
      {
        return (this.currentCard() || 0) > (this.otherActivePlayer?.currentCard() || 0);
      }
      return false;
    });

    // GAME STATUS
    // determines if the current player is winning the overall game
    /** @readonly Computed signal indicating if player is winning the game */
    public readonly isWinning = computed<boolean>(() => {
      if((this.score() ?? 0) > (this.otherActivePlayer?.score() || 0))
        return true;
      else 
        return false;
    })

    // CARD PICKING
    // handles the logic for picking a card from the deck
    /** Picks a card from the deck and updates the current card and deck state */
    public pickCard = () => {
      const cardDeck = this.cardDeck();
      this._currentCard.update((card:number | null) => cardDeck?.pop() || null);
      this._cardDeck.update((deck:number[]) => [...cardDeck]);
    };
}
