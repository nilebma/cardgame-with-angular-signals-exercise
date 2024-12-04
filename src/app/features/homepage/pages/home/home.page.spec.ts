import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home.page';
import { GameService } from '../../../games/services/game.service';
import { PlayerService } from '../../../players/services/player.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlayerService, GameService]
    });

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
