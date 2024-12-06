import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, NavController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { GameBoardComponent } from 'src/app/features/activegame/ui/game-board/game-board.component';
import { GameState } from 'src/app/features/activegame/models/activegame.model';

@Component({
  selector: 'app-activegame',
  templateUrl: './activegame.page.html',
  styleUrls: ['./activegame.page.scss'],
  standalone: true,
  imports: [IonContent,
            IonHeader,
            IonTitle,
            IonToolbar,
            CommonModule,
            FormsModule,
            IonButtons,
            IonBackButton,
            GameBoardComponent]
})
export class ActivegamePage {

  private alertController = inject(AlertController);
  private navCtrl = inject(NavController);

  gameState = signal<GameState | null>(null);

  setGameState(state:any) {
    console.log("setGameState", state);
    if(state && typeof state === 'string')
      this.gameState.set(state as GameState);
  }

  gobackWhenGameIsSaved = effect(() => {
    if(this.gameState() === 'saved')
      this.goBackToHomePage();
  });

  canDeactivate() {
    console.log("canDeactivate", this.gameState());
    return this.gameState() === 'playerSelection' || this.gameState() === 'saved';
  }

  async showExitDialog() {
    const alert = await this.alertController.create({
      header: 'Quitter la partie',
      message: 'Voulez-vous vraiment quitter la partie ?',
      buttons: [
        {
          text: 'Quitter',
          role: 'confirm',
        },
        {
          text: 'Annuler',
          role: 'cancel',
        }
      ]
    });
    await alert.present();
    return await alert.onDidDismiss();
  }

  private goBackToHomePage() {
    this.navCtrl.navigateBack('/home');
  }

}
