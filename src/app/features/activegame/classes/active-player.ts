import { computed, inject, signal, Signal } from "@angular/core";
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
    /** The player service injected for player data access */
    private playerService = inject(PlayerService);

    // CONSTRUCTOR 
    /**
     * @param gamesRounds - Signal containing the array of played card pairs for score calculation
     */
    constructor(public gamesRounds:Signal<Array<[PlayedCard, PlayedCard]>>) 
    {
    }

    // PLAYER ID
    // represents the unique identifier of the player that can be null at start
    private _id = signal<number | null>(null);
    public readonly id = this._id.asReadonly();
    public setPlayerId(id:any) {
      if(typeof id === 'number' || id === null)
        this._id.set(id);
    }


    // OTHER PLAYER REFERENCE
    // sets the reference to the other player for score calculations
    private otherActivePlayer:ActivePlayer | null = null;
    public setOtherActivePlayer(otherActivePlayer:ActivePlayer) 
    {
        this.otherActivePlayer = otherActivePlayer;
    }


    // CARD DECK
    // represents the deck of cards that the player has
    private _cardDeck = signal<number[]>([]);
    public readonly cardDeck = this._cardDeck.asReadonly();
    public setCardDeck(cardDeck:number[]) {
        this._cardDeck.set(cardDeck);
    }
  

    // CURRENT CARD
    // represents the card that the player has picked for the current round
    private _currentCard = signal<number | null>(null);
    public readonly currentCard = this._currentCard.asReadonly();
    public removeCurrentCardFromHand() {
      this._currentCard.set(null);
    }


    // CAN PLAY
    // define if the player can play a card in the current round
    private _canPlay = signal<boolean>(true);
    public readonly canPlay = this._canPlay.asReadonly();
    public updateCanPlayStatus(canPlay:boolean) {
      this._canPlay.set(canPlay);
    }


    // PLAYER NAME
    // gets the name of the current player by looking it up in the player service
    public readonly name = computed<string | null>(() => {
      const playerId = this.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    });

    // PLAYER SCORE
    // calculates the score of the current player by counting won rounds
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
    public readonly potentialPlayers = computed<Player[]>(() => {
      if(this.otherActivePlayer) 
      {
        return this.playerService.data().filter(player => player.id !== (this.otherActivePlayer as ActivePlayer).id());
      }
      return [];
    });

    // ROUND STATUS
    // determines if the current player is winning the current round
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
