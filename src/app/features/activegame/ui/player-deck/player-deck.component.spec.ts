import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PlayerDeckComponent } from './player-deck.component';

describe('PlayerDeckComponent', () => {
  let component: PlayerDeckComponent;
  let fixture: ComponentFixture<PlayerDeckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDeckComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('player', null);
    fixture.componentRef.setInput('gameState', 'playerSelection'); 
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
