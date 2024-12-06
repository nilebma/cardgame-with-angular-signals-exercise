import { CanDeactivateFn } from '@angular/router';
import { ActivegamePage } from '../../../pages/activegame/activegame.page';

export const canLeaveGameGuard: CanDeactivateFn<ActivegamePage> = async (component: ActivegamePage) => {
  let canDeactivate = await component.canDeactivate();
  return canDeactivate;
};
