import { TestBed } from '@angular/core/testing';

import { SqliteDb } from './sqlite-db';

describe('SqliteDb', () => {
  let service: SqliteDb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SqliteDb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
