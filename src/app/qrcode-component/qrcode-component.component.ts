import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeModule, QRCodeComponent } from 'angularx-qrcode';
import jsQR from 'jsqr';

@Component({
  selector: 'app-qrcode-component',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './qrcode-component.component.html',
  styleUrls: ['./qrcode-component.component.css']
})
export class QRCodeComponentComponent {
  @ViewChild(QRCodeComponent) qrCode!: QRCodeComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;
  qrData: string = '';
  decodedText: string | null = null;
  copySuccess: boolean = false;
  isDragging = false;

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

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    if (file.type.match(/image\/(png|jpeg)/)) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              this.decodedText = code.data;
            } else {
              this.decodedText = 'No QR code found in the image.';
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.decodedText = 'Please upload a valid image file (PNG or JPEG).';
    }
  }

  copyToClipboard() {
    if (this.decodedText) {
      navigator.clipboard.writeText(this.decodedText).then(() => {
        this.copySuccess = true;
        setTimeout(() => this.copySuccess = false, 3000);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    }
  }
}
