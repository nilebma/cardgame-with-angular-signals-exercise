import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivegamePage } from './activegame.page';
import { GameService } from '../../features/games/services/game.service';
import { PlayerService } from '../../features/players/services/player.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ActivegamePage', () => {
  let component: ActivegamePage;
  let fixture: ComponentFixture<ActivegamePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });   
    fixture = TestBed.createComponent(ActivegamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
