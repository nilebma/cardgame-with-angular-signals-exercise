import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivegamePage } from './activegame.page';

describe('ActivegamePage', () => {
  let component: ActivegamePage;
  let fixture: ComponentFixture<ActivegamePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivegamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
