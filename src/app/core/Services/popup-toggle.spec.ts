import { TestBed } from '@angular/core/testing';

import { PopupToggle } from './popup-toggle';
import { PopupParam } from '../Interfaces/popup-param';

describe('PopupToggle', () => {
  let service: PopupToggle;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopupToggle);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('preserves rapid open and close requests', () => {
    const requests: PopupParam[] = [];
    const subscription = service.popupSubject.subscribe((data) => requests.push(data));
    const open: PopupParam = {
      title: 'Open Source',
      content: '',
      visible: true,
      kind: 'github',
      githubUser: 'vlado-1',
    };
    const close = { ...open, visible: false };

    service.togglePopup(open);
    service.togglePopup(close);
    service.togglePopup(open);

    expect(requests.map(({ visible }) => visible)).toEqual([true, false, true]);
    subscription.unsubscribe();
  });

  it('tracks whether a popup is currently visible', () => {
    service.togglePopup({
      title: 'Open Source',
      content: '',
      visible: true,
      kind: 'github',
    });
    expect(service.isVisible).toBe(true);

    service.togglePopup({
      title: 'Open Source',
      content: '',
      visible: false,
      kind: 'github',
    });
    expect(service.isVisible).toBe(false);
  });
});
