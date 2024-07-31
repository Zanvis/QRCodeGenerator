import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QRCodeComponentComponent } from './qrcode-component/qrcode-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, QRCodeComponentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'QRCode';
}
