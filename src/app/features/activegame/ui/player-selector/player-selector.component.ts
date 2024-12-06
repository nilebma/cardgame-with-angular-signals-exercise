import { Component, effect, input, model, OnInit, Signal } from '@angular/core';
import { Player } from 'src/app/features/players/models/player.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';

@Component({
  selector: 'app-player-selector',
  templateUrl: './player-selector.component.html',
  styleUrls: ['./player-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonSelect, IonSelectOption ]
})
export class PlayerSelectorComponent  implements OnInit {

  selectedPlayerId = model.required(); // specifying the type here is not working (angular bug ?)
  potentialPlayers = input.required<Player[]>();

  private selectedPlayerEffect = effect(() => {
    console.log('potentialPlayers', this.potentialPlayers());
  });
  constructor() { }

  ngOnInit() {}

}
