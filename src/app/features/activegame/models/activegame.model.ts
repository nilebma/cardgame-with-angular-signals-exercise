export type GameState = 'onGoing' | 'over' | 'playerSelection' | 'saved';

export interface PlayedCard {
  playerId:number;
  card:number;
}