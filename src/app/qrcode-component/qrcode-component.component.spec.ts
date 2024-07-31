import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeComponentComponent } from './qrcode-component.component';

describe('QRCodeComponentComponent', () => {
  let component: QRCodeComponentComponent;
  let fixture: ComponentFixture<QRCodeComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRCodeComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRCodeComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
