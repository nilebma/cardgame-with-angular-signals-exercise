import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, NavController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { GameBoardComponent } from 'src/app/features/activegame/ui/game-board/game-board.component';
import { GameState } from 'src/app/features/activegame/models/activegame.model';

// this page present an active game and let two player play the game.
// The game is presented via the game-board component. 
// Here we handle the toolbar and the exit dialog if user wants to quit the game while it is in progress
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

  // DEPENDENCIES
  private alertController = inject(AlertController);
  private navCtrl = inject(NavController);

  // GAME STATE
  // represents the current state of the game, it is re
  gameState = signal<GameState | null>(null);
  setGameState(state:any) {
    console.log("setGameState", state);
    if(state && typeof state === 'string')
      this.gameState.set(state as GameState);
  }

  // EXIT PAGE
  // when the game is saved, we go back to the home page
  gobackWhenGameIsSaved = effect(() => {
    if(this.gameState() === 'saved')
      this.goBackToHomePage();
  });
  private goBackToHomePage() {
    this.navCtrl.navigateBack('/home');
  }

  // method used by guard to check if the page can be deactivated
  async canDeactivate() {
    console.log("canDeactivate", this.gameState());
    if(this.gameState() === 'playerSelection' || this.gameState() === 'saved')
      return true;
    else
    {
      let result = await this.showExitDialog();
      return result.role === 'confirm';
    }
  }

  // method used by guard to show the exit dialog, when the page is about to be deactivated
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
}
