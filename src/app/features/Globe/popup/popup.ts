import { Component } from '@angular/core';
import { PopupParam } from '../../../core/Interfaces/popup-param';
import { PopupToggle } from '../../../core/Services/popup-toggle';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup',
  imports: [CommonModule],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
})
export class Popup {
  data: PopupParam = { title: '', content: '', visible: false };
  popupToggle: PopupToggle;

  constructor(private pt: PopupToggle) {
    pt.popupSubject.subscribe((pData: PopupParam) => {
      this.data = pData;
    });
    this.popupToggle = pt;
  }

  closePopup(): void {
    this.data.visible = false;
    this.popupToggle.togglePopup(this.data);
  }
}
