import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PopupParam } from '../Interfaces/popup-param';

@Injectable({
  providedIn: 'root',
})
export class PopupToggle {
  popupSubject: Subject<PopupParam> = new Subject<PopupParam>();
  isVisible = false;

  togglePopup(data: PopupParam): void {
    this.isVisible = data.visible;
    this.popupSubject.next(data);
  }
}
