import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonButton, IonIcon, IonButtons, NavController, IonProgressBar } from '@ionic/angular/standalone';
import { GameService } from '../../features/games/services/game.service';
import { ScoreboardComponent } from '../../features/games/ui/scoreboard/scoreboard.component';
import { iosTransitionAnimation } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircle } from 'ionicons/icons';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonList, IonHeader, IonToolbar, IonTitle, IonContent, ScoreboardComponent, IonButton, IonIcon, IonButtons, IonProgressBar],
})
export class HomePage {
  public gameService = inject(GameService);
  private navCtrl = inject(NavController);
  constructor() {
    addIcons({addCircle});
  }

  goToActiveGame() {
    // This allow to go to the activegame page with a right to left animation
    this.navCtrl.navigateForward('/activegame', {
      animated: true,
      animation: iosTransitionAnimation 
    });
  }
} 
