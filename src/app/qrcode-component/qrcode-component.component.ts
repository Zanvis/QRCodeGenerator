import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeModule, QRCodeComponent } from 'angularx-qrcode';
import jsQR from 'jsqr';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface QRCodeHistoryItem {
  id: string;
  data: string;
  type: 'generated' | 'scanned';
  timestamp: Date;
}

@Component({
  selector: 'app-qrcode-component',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule, TranslateModule],
  templateUrl: './qrcode-component.component.html',
  styleUrls: ['./qrcode-component.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition(':enter, :leave', [
        animate('300ms ease-in-out')
      ])
    ]),
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
  isSidebarOpen = false;
  currentLang: string = 'en';
  invalidFileErrorKey: string | null = null;
  clipboardCopyErrorKey: string | null = null;
  noQRCodeFoundKey: string | null = null;
  isDropdownOpen = false;
  languages = [
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polski' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'ru', name: 'Русский' },
    { code: 'jp', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' }
  ];

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectLanguage(langCode: string) {
    this.currentLang = langCode;
    this.changeLanguage();
    this.isDropdownOpen = false;
  }

  getCurrentLanguageName(): string {
    const currentLanguage = this.languages.find(lang => lang.code === this.currentLang);
    return currentLanguage ? currentLanguage.name : 'Select Language';
  }
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private translate : TranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
    }
    translate.setDefaultLang('en');
    translate.use(this.currentLang);
  }
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
        console.error(this.translate.instant('errors.canvasNotFound'));
      }
    } else {
      console.error(this.translate.instant('errors.qrComponentNotFound'));
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
    this.invalidFileErrorKey = null;
    this.noQRCodeFoundKey = null;
    this.decodedText = null;
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
              this.noQRCodeFoundKey = 'errors.noQRCodeFound';
              this.updateErrorMessages();
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // this.decodedText = this.translate.instant('errors.invalidFile');
      this.invalidFileErrorKey = 'errors.invalidFile';
      this.updateErrorMessages();
    }
  }
  copyToClipboard() {
    if (this.decodedText) {
      navigator.clipboard.writeText(this.decodedText).then(() => {
        this.copySuccess = true;
        setTimeout(() => this.copySuccess = false, 3000);
      }).catch(err => {
        // console.error('Could not copy text: ', err);
        this.clipboardCopyErrorKey = 'errors.clipboardCopyFailed';
        this.updateErrorMessages();
      });
    }
  }

  private addToHistory(item: QRCodeHistoryItem) {
    const newItem = {
        ...item,
        id: this.generateUniqueId()
    };
    this.qrCodeHistory.unshift(newItem);
    // Limit history to last 10 items
    this.qrCodeHistory = this.qrCodeHistory.slice(0, 10);
    this.saveHistoryToLocalStorage();
}
  
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

  deleteHistoryItem(id: string) {
    this.qrCodeHistory = this.qrCodeHistory.filter(item => item.id !== id);
    this.saveHistoryToLocalStorage();
  }

  changeLanguage() {
    this.translate.use(this.currentLang);
    localStorage.setItem('preferredLanguage', this.currentLang);
    this.updateErrorMessages();
  }

  updateErrorMessages() {
    if (this.invalidFileErrorKey) {
      this.decodedText = this.translate.instant(this.invalidFileErrorKey);
    }
    if (this.clipboardCopyErrorKey) {
      console.error(this.translate.instant(this.clipboardCopyErrorKey));
    }
    if (this.noQRCodeFoundKey) {
      this.decodedText = this.translate.instant(this.noQRCodeFoundKey);
    }
  }
}
