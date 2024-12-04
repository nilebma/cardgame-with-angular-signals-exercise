import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ScoreboardComponent } from './scoreboard.component';
import { Game } from '../../game.model';
import { signal } from '@angular/core';

describe('ScoreboardComponent', () => {
  let component: ScoreboardComponent;
  let fixture: ComponentFixture<ScoreboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ScoreboardComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreboardComponent);
    fixture.componentRef.setInput('game', {
                                  id: '1',
                                  scores: [
                                    { playerName: 'Player 1', score: 10, winner: true }, 
                                    { playerName: 'Player 2', score: 5, winner: false }]
                               });

    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display player scores and names correctly', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const scoreElements = compiled.querySelectorAll('.player-score');
    
    expect(scoreElements.length).toBe(2);
    expect(scoreElements[0].textContent).toContain('10');
    expect(scoreElements[1].textContent).toContain('5');

    const playerNameElements = compiled.querySelectorAll('.player-name');
    expect(playerNameElements.length).toBe(2);
    expect(playerNameElements[0].textContent).toContain('Player 1');
    expect(playerNameElements[1].textContent).toContain('Player 2');
  });

  it('should display winner decoration', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const winnerElements = compiled.querySelectorAll('.winner');
    expect(winnerElements.length).toBe(1);
    expect(winnerElements[0].textContent).toContain('🏆 Player 1 10');
  });
});
