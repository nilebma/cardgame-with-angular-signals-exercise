import { computed, effect, inject, signal, Signal } from "@angular/core";
import { PlayerService } from "../../players/services/player.service";
import { PlayedCard } from "../../../pages/activegame/activegame.page";

// TODO : some properties are defined as signals, and can be updated outside of the class. 
//        This is not a good practice and they should be exposed as readonly Observables instead.
export class ActivePlayer {
    private playerService = inject(PlayerService);
    private otherActivePlayer:ActivePlayer | null = null;

    constructor(public gamesRounds:Signal<Array<[PlayedCard, PlayedCard]>>) 
    {
    }

    setOtherActivePlayer(otherActivePlayer:ActivePlayer) {
      this.otherActivePlayer = otherActivePlayer;
    }

    setCardDeck(cardDeck:number[]) {
      this.cardDeck.set(cardDeck);
    }

    setPlayerId(id:any) {
      if(typeof id === 'number' || id === null)
        this.id.set(id);
    }

    id =  signal<number | null>(null); // will be populated by the player selector component

    name = computed(() => {
      const playerId = this.id();
      if(playerId) {
        return this.playerService.playerById()[playerId]?.name;
      }
      return null;
    });

    cardDeck = signal<number[]>([]);

     // will be populated by the dealCard method
    score = computed(() => this.gamesRounds().reduce((acc, fight) => 
      {
        const activePlayerCard = fight.find(card => card.playerId === this.id());
        const otherPlayerCard = fight.find(card => card.playerId !== this.id());
        if(activePlayerCard && otherPlayerCard && activePlayerCard.card > otherPlayerCard.card) {
          return acc + 1;
        }
        return acc;
      }, 0)
    );

    potentialPlayers = computed(() => {
      if(this.otherActivePlayer) 
      {
        return this.playerService.data().filter(player => player.id !== (this.otherActivePlayer as ActivePlayer).id());
      }
      return [];
    });

    pickCard = () => { // will be called by the playerDeck component
      const cardDeck = this.cardDeck();
      this.currentCard.update((card:number | null) => cardDeck?.pop() || null);
      this.cardDeck.update((deck:number[]) => [...cardDeck]);
    };

    currentCard = signal<number | null>(null);
     // will be updated by the playerDeck component and the pickCard method
    canPlay = signal(true);
     // will be updated by the pickCardEffect
    isWinningRound = computed(() => {
      if(this.currentCard() && this.otherActivePlayer?.currentCard())
      {
        return (this.currentCard() || 0) > (this.otherActivePlayer?.currentCard() || 0);
      }
      return false;
    });

    isWinning  = computed(() => {
      if((this.score() ?? 0) > (this.otherActivePlayer?.score() || 0))
        return true;
      else 
        return false;
    })
}
