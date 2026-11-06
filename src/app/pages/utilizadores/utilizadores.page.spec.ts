import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilizadoresPage } from './utilizadores.page';

describe('UtilizadoresPage', () => {
  let component: UtilizadoresPage;
  let fixture: ComponentFixture<UtilizadoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UtilizadoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
