import { Signal } from "@angular/core";

export interface Player {
    id: number;
    name: string;
}

export interface ActivePlayer {
  id: Signal<number | null>;
  name: Signal<string | null>;
  cardDeck:any,
  score:Signal<number | null>;
  potentialPlayers:Signal<Array<Player>>;
  isWinning:Signal<boolean>;
  isWinningRound:Signal<boolean>;
  currentCard:any;
  canPlay:any;
  pickCard:() => void;
}