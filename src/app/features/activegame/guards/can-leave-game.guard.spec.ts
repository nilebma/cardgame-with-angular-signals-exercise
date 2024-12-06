import { TestBed } from '@angular/core/testing';
import { CanDeactivateFn } from '@angular/router';

import { canLeaveGameGuard } from './can-leave-game.guard';
import { ActivegamePage } from 'src/app/activegame/activegame.page';

describe('canLeaveGameGuard', () => {
  const executeGuard: CanDeactivateFn<ActivegamePage> = (...guardParameters) => 
      TestBed.runInInjectionContext(() => canLeaveGameGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
