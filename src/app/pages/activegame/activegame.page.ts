import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, NavController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { GameBoardComponent } from 'src/app/features/activegame/ui/game-board/game-board.component';
import { GameState } from 'src/app/features/activegame/models/activegame.model';

/**
 * ActivegamePage Component
 * This page presents an active game and lets two players play the game.
 * The game is presented via the game-board component. 
 * Here we handle the toolbar and the exit dialog if user wants to quit the game while it is in progress
 */
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

  /** Alert controller service for displaying dialogs */
  private alertController = inject(AlertController);
  
  /** Navigation controller service for page navigation */
  private navCtrl = inject(NavController);

  /**
   * Game state signal
   * Represents the current state of the game
   * @type {Signal<GameState | null>}
   */
  gameState = signal<GameState | null>(null);

  /**
   * Updates the game state
   * @param {any} state - The new game state to set
   */
  setGameState(state:any) {
    console.log("setGameState", state);
    if(state && typeof state === 'string')
      this.gameState.set(state as GameState);
  }

  /**
   * Effect that triggers navigation to home page when game is saved
   */
  gobackWhenGameIsSaved = effect(() => {
    if(this.gameState() === 'saved')
      this.goBackToHomePage();
  });

  /**
   * Navigates back to the home page
   * @private
   */
  private goBackToHomePage() {
    this.navCtrl.navigateBack('/home');
  }

  /**
   * Guard method to check if the page can be deactivated
   * @returns {Promise<boolean>} True if page can be deactivated, false otherwise
   */
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

  /**
   * Displays an exit confirmation dialog
   * @returns {Promise<any>} Dialog dismissal data
   */
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
