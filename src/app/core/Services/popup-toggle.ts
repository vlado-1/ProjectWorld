import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PopupParam } from '../Interfaces/popup-param';

@Injectable({
  providedIn: 'root',
})
export class PopupToggle {
  popupSubject: Subject<PopupParam> = new Subject<PopupParam>();
  isVisible = false;
  private markerOpenBlockedUntil = 0;

  togglePopup(data: PopupParam): void {
    this.isVisible = data.visible;
    if (!data.visible) {
      this.markerOpenBlockedUntil = Date.now() + 500;
    }
    this.popupSubject.next(data);
  }

  isMarkerOpenAllowed(now = Date.now()): boolean {
    return now >= this.markerOpenBlockedUntil;
  }
}
