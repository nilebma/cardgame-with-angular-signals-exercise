export interface GameRaw {
    id: number;
    scores: ScoreRaw[];
  }
  
  export interface ScoreRaw {
    playerId: number;
    score: number;
  }
  
  export interface Score extends ScoreRaw {
    playerName: string;
    winner: boolean;
  }
  
  export interface Game extends GameRaw {
    scores: Score[];
  }