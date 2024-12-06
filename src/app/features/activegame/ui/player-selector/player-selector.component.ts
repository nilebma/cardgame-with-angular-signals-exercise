import { Component, effect, input, model, OnInit, output, signal, Signal } from '@angular/core';
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

  selectedPlayerIdEmitter = output<number | null>({
    alias: 'selectedPlayerId'
  }); 

  selectedPlayerId = signal<number | null>(null);
  potentialPlayers = input.required<Player[]>();

  private playerIdEmitterEffect = effect(() => {
    this.selectedPlayerIdEmitter.emit(this.selectedPlayerId());
  });

  constructor() { }

  ngOnInit() {}

}
