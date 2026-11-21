import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Github } from './github';

describe('Github', () => {
  let service: Github;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Github);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps public pull requests into popup entries and caches the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            title: 'Add a feature',
            body: '## Summary\n\nA useful **change**.',
            html_url: 'https://github.com/example/project/pull/1',
            repository_url: 'https://api.github.com/repos/example/project',
            state: 'closed',
            pull_request: {
              merged_at: '2026-11-21T00:00:00Z',
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await service.getPullRequests('vlado-1');
    const second = await service.getPullRequests('vlado-1');

    expect(first).toEqual([
      {
        title: 'Add a feature',
        repository: 'example/project',
        summary: 'Summary A useful change.',
        url: 'https://github.com/example/project/pull/1',
        status: 'merged',
      },
    ]);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps underscores in words and strips HTML tags from summaries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              title: 'Rename',
              body: 'Rename <b>snake_case_name</b> to _camel_ and __bold__ text.',
              html_url: 'https://github.com/example/project/pull/2',
              repository_url: 'https://api.github.com/repos/example/project',
              state: 'open',
              pull_request: { merged_at: null },
            },
          ],
        }),
      }),
    );

    const [pullRequest] = await service.getPullRequests('vlado-1');

    expect(pullRequest.summary).toBe('Rename snake_case_name to camel and bold text.');
  });

  it('fetches additional pages when a page is full', async () => {
    const makeItem = (n: number) => ({
      title: `PR ${n}`,
      body: null,
      html_url: `https://github.com/example/project/pull/${n}`,
      repository_url: 'https://api.github.com/repos/example/project',
      state: 'open',
      pull_request: { merged_at: null },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: Array.from({ length: 100 }, (_, i) => makeItem(i)) }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [makeItem(100)] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.getPullRequests('vlado-1');

    expect(result).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports failed GitHub requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      }),
    );

    await expect(service.getPullRequests('vlado-1')).rejects.toThrow(
      'GitHub request failed (403 Forbidden).',
    );
  });
});
