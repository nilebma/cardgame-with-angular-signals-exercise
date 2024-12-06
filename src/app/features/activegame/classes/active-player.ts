import { computed, effect, inject, signal, Signal } from "@angular/core";
import { PlayerService } from "../../players/services/player.service";
import { PlayedCard } from "../models/activegame.model";
import { Player } from "../../players/models/player.model";

// This class represents the current active player, and it is used
// - to handle the data and logic of the player during a gmes (deck, card, can play status, score etc.)
// - to hold and calculate some handy data like player name, score, etc.
export class ActivePlayer {
    private playerService = inject(PlayerService);
    // the other active player, that is used to calculate the score amngst other things
    private otherActivePlayer:ActivePlayer | null = null;

    constructor(public gamesRounds:Signal<Array<[PlayedCard, PlayedCard]>>) 
    {
    }
    
    // the player id, that does not have to be set from start
    private _id =  signal<number | null>(null);
    public readonly id = this._id.asReadonly();
    // we set the player id
    public setPlayerId(id:any) {
      if(typeof id === 'number' || id === null)
        this._id.set(id);
    }

    // CARD DECK
    // represents the deck of cards that the player has
    private _cardDeck = signal<number[]>([]); // the value is set in the setCardDeck method, called by the game board
    public readonly cardDeck = this._cardDeck.asReadonly();
    // we distribute the cards to the player
    public setCardDeck(cardDeck:number[]) {
        this._cardDeck.set(cardDeck);
    }
  
    // CURRENT CARD
    // represents the card that the player has picked for the current round
    private _currentCard = signal<number | null>(null); // the value is set in the pickCard method or via the removeCurrentCardFromHand method
    public readonly currentCard = this._currentCard.asReadonly();
    // we remove the current card from the player hand, as a round is completed
    public removeCurrentCardFromHand() {
      this._currentCard.set(null);
    }

    // CAN PLAY
    // define if the player can play a card in the current round
    private _canPlay = signal<boolean>(true); // the value is set in the updateCanPlayStatus method, called by the game board
    public readonly canPlay = this._canPlay.asReadonly();
    // we update the player can play status
    public updateCanPlayStatus(canPlay:boolean) {
      this._canPlay.set(canPlay);
    }

    // PLAYER NAME
    // we get the name of the current player, by looking it up in the player service
    public readonly name = computed<string | null>(() => {
      const playerId = this.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    });

    // we calculate the score of the current player, by summing up the number of rounds won
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

    // we get the potential players that the user can choose from, if the player is not already set up
    public readonly potentialPlayers = computed<Player[]>(() => {
      if(this.otherActivePlayer) 
      {
        return this.playerService.data().filter(player => player.id !== (this.otherActivePlayer as ActivePlayer).id());
      }
      return [];
    });

    // we determine if the current player is winning the current  round, and expose it as a signal
    public readonly isWinningRound = computed<boolean>(() => {
      // it is important to check if both players have a card on the table (otherwise no winner)
      if(this.currentCard() && this.otherActivePlayer?.currentCard())
      {
        return (this.currentCard() || 0) > (this.otherActivePlayer?.currentCard() || 0);
      }
      return false;
    });

    // we determine if the current player is winning the game, and expose it as a signal
    public readonly isWinning = computed<boolean>(() => {
      if((this.score() ?? 0) > (this.otherActivePlayer?.score() || 0))
        return true;
      else 
        return false;
    })

    // we set the other active player, so current player can calculate its score
    public setOtherActivePlayer(otherActivePlayer:ActivePlayer) {
      this.otherActivePlayer = otherActivePlayer;
    }

    // we ask the player to pick a card and update its current card
    public pickCard = () => {
      const cardDeck = this.cardDeck();
      this._currentCard.update((card:number | null) => cardDeck?.pop() || null);
      this._cardDeck.update((deck:number[]) => [...cardDeck]);
    };
}
