import { TestBed } from '@angular/core/testing';

import { PopupToggle } from './popup-toggle';

describe('PopupToggle', () => {
  let service: PopupToggle;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopupToggle);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
