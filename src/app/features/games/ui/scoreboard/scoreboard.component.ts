import { Component, input, OnInit } from '@angular/core';
import { IonItem } from '@ionic/angular/standalone';
import { Game } from '../../game.model';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss'],
  standalone: true,
  imports: [IonItem],
})
export class ScoreboardComponent {

  game = input.required<Game>()

}
