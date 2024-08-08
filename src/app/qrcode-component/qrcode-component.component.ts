import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeModule, QRCodeComponent } from 'angularx-qrcode';
import jsQR from 'jsqr';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface QRCodeHistoryItem {
  id: string;
  data: string;
  type: 'generated' | 'scanned';
  timestamp: Date;
}

@Component({
  selector: 'app-qrcode-component',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './qrcode-component.component.html',
  styleUrls: ['./qrcode-component.component.css'],
  animations: [
    trigger('sidebarAnimation', [
      state('open', style({
        transform: 'translateX(0)',
      })),
      state('closed', style({
        transform: 'translateX(100%)',
      })),
      transition('open <=> closed', [
        animate('300ms ease-in-out')
      ]),
    ]),
  ]
})

export class QRCodeComponentComponent implements OnInit {
  @ViewChild(QRCodeComponent) qrCode!: QRCodeComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;
  qrData: string = '';
  decodedText: string | null = null;
  copySuccess: boolean = false;
  isDragging = false;
  qrCodeHistory: QRCodeHistoryItem[] = [];
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  ngOnInit() {
    this.loadHistoryFromLocalStorage();
  }

  downloadQRCode() {
    if (this.qrCode) {
      const canvas = this.qrCode.qrcElement.nativeElement.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = dataUrl;
        link.click();
        this.addToHistory({
          id: this.generateUniqueId(),
          data: this.qrData,
          type: 'generated',
          timestamp: new Date()
        });
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
              this.addToHistory({
                id: this.generateUniqueId(),
                data: this.decodedText,
                type: 'scanned',
                timestamp: new Date()
              });
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

  private addToHistory(item: QRCodeHistoryItem) {
    this.qrCodeHistory.unshift(item);
    // Limit history to last 10 items
    this.qrCodeHistory = this.qrCodeHistory.slice(0, 10);
    this.saveHistoryToLocalStorage();
  }
  
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private saveHistoryToLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('qrCodeHistory', JSON.stringify(this.qrCodeHistory));
    }
  }
  
  private loadHistoryFromLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const history = localStorage.getItem('qrCodeHistory');
      if (history) {
        this.qrCodeHistory = JSON.parse(history);
      }
    }
  }
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  reuseHistoryItem(item: QRCodeHistoryItem) {
    this.qrData = item.data;
    if (item.type === 'generated') {
      // Trigger QR code generation if needed
    } else {
      this.decodedText = item.data;
    }
  }
  
  clearHistory() {
    this.qrCodeHistory = [];
    this.saveHistoryToLocalStorage();
  }
}
