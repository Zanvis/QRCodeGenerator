import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-qrcode-component',
  standalone: true,
  imports: [CommonModule, QRCodeModule, FormsModule],
  templateUrl: './qrcode-component.component.html',
  styleUrl: './qrcode-component.component.css'
})
export class QRCodeComponentComponent {
  @ViewChild(QRCodeComponent) qrCode!: QRCodeComponent;
  qrData: string = '';

  downloadQRCode() {
    if (this.qrCode) {
      const canvas = this.qrCode.qrcElement.nativeElement.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = dataUrl;
        link.click();
      } else {
        console.error('Canvas element not found');
      }
    } else {
      console.error('QR Code component not found');
    }
  }
}
