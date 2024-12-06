import { computed, effect, inject, signal, Signal } from "@angular/core";
import { PlayerService } from "../../players/services/player.service";
import { PlayedCard } from "../models/activegame.model";
import { Player } from "../../players/models/player.model";

export class ActivePlayer {
    private playerService = inject(PlayerService);
    private otherActivePlayer:ActivePlayer | null = null;

    public setOtherActivePlayer(otherActivePlayer:ActivePlayer) {
      this.otherActivePlayer = otherActivePlayer;
    }

    public setCardDeck(cardDeck:number[]) {
      this._cardDeck.set(cardDeck);
    }

    public setPlayerId(id:any) {
      if(typeof id === 'number' || id === null)
        this._id.set(id);
    }

    public updateCanPlayStatus(canPlay:boolean) {
      this._canPlay.set(canPlay);
    }

    public removeCurrentCardFromHand() {
      this._currentCard.set(null);
    }

    constructor(public gamesRounds:Signal<Array<[PlayedCard, PlayedCard]>>) 
    {
    }

    public pickCard = () => { // will be called by the playerDeck component
        const cardDeck = this.cardDeck();
        this._currentCard.update((card:number | null) => cardDeck?.pop() || null);
        this._cardDeck.update((deck:number[]) => [...cardDeck]);
      };

    private _id =  signal<number | null>(null); // will be populated by the player selector component
    public readonly id = this._id.asReadonly();

    public readonly name = computed<string | null>(() => {
      const playerId = this.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    });

    private _cardDeck = signal<number[]>([]);
    public readonly cardDeck = this._cardDeck.asReadonly();

     // will be populated by the dealCard method
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

    public readonly potentialPlayers = computed<Player[]>(() => {
      if(this.otherActivePlayer) 
      {
        return this.playerService.data().filter(player => player.id !== (this.otherActivePlayer as ActivePlayer).id());
      }
      return [];
    });

    private _currentCard = signal<number | null>(null);
    public readonly currentCard = this._currentCard.asReadonly();

     // will be updated by the playerDeck component and the pickCard method
    private _canPlay = signal<boolean>(true);
    public readonly canPlay = this._canPlay.asReadonly();
     // will be updated by the pickCardEffect
    public readonly isWinningRound = computed<boolean>(() => {
      if(this.currentCard() && this.otherActivePlayer?.currentCard())
      {
        return (this.currentCard() || 0) > (this.otherActivePlayer?.currentCard() || 0);
      }
      return false;
    });

    public readonly isWinning = computed<boolean>(() => {
      if((this.score() ?? 0) > (this.otherActivePlayer?.score() || 0))
        return true;
      else 
        return false;
    })
}
