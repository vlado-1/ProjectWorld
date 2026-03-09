import { Component } from '@angular/core';
import { PopupParam } from '../../../core/Interfaces/popup-param';
import { PopupToggle } from '../../../core/Services/popup-toggle';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-popup',
  imports: [CommonModule],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
})
export class Popup {
  data: PopupParam = { title: '', content: '', visible: false, videoSrc: '' };
  popupToggle: PopupToggle;

  constructor(private pt: PopupToggle, private sanitizer: DomSanitizer) {
    pt.popupSubject.subscribe((pData: PopupParam) => {
      this.data = pData;
    });
    this.popupToggle = pt;
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  closePopup(): void {
    this.data.visible = false;
    this.popupToggle.togglePopup(this.data);
  }
}
