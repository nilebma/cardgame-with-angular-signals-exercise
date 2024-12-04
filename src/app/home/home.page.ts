import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList } from '@ionic/angular/standalone';
import { GameService } from '../features/games/game.service';
import { ScoreboardComponent } from '../features/games/ui/scoreboard/scoreboard.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonList, IonHeader, IonToolbar, IonTitle, IonContent, ScoreboardComponent],
})
export class HomePage {
  public gameService = inject(GameService);
  constructor() {}
} 
