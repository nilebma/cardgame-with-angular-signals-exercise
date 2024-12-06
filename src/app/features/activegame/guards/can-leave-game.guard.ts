import { CanDeactivateFn } from '@angular/router';
import { ActivegamePage } from '../../../activegame/activegame.page';

export const canLeaveGameGuard: CanDeactivateFn<ActivegamePage> = async (component: ActivegamePage) => {
  let canDeactivate = component.canDeactivate();
  if(!canDeactivate) {
    let result = await component.showExitDialog();
    canDeactivate = result.role === 'confirm';
  }
  return canDeactivate;
};
