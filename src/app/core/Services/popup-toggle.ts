import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PopupParam } from '../Interfaces/popup-param';

@Injectable({
  providedIn: 'root',
})
export class PopupToggle {
  popupSubject: Subject<PopupParam> = new Subject<PopupParam>();
  lastPopupTime: number = 0;

  togglePopup(data: PopupParam): void {
    // If a double up of click events between globe and close button of popup occurs
    // then close popup will override.
    var currentPopupTime: number = Date.now();
    if (currentPopupTime - this.lastPopupTime > 500 ) {
      this.lastPopupTime = currentPopupTime;
    }
    else {
      data.visible = false;
    }
    
    this.popupSubject.next(data);
  }
}
