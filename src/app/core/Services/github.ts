import { Injectable } from '@angular/core';
import { GithubPullRequest } from '../Interfaces/github-pull-request';

interface GithubSearchResponse {
  items: Array<{
    title: string;
    body: string | null;
    html_url: string;
    repository_url: string;
    state: 'open' | 'closed';
    pull_request: {
      merged_at: string | null;
    };
  }>;
}

const PAGE_SIZE = 100;
// GitHub's search API only returns the first 1000 results.
const MAX_PAGES = 10;

@Injectable({
  providedIn: 'root',
})
export class Github {
  private cache = new Map<string, { expiresAt: number; pullRequests: GithubPullRequest[] }>();

  async getPullRequests(username: string): Promise<GithubPullRequest[]> {
    const cached = this.cache.get(username);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.pullRequests;
    }

    const query = `author:${username} is:pr is:public -user:${username}`;
    const items: GithubSearchResponse['items'] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${PAGE_SIZE}&page=${page}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`GitHub request failed (${response.status} ${response.statusText}).`);
      }

      const result = (await response.json()) as GithubSearchResponse;
      items.push(...result.items);
      if (result.items.length < PAGE_SIZE) {
        break;
      }
    }

    const pullRequests: GithubPullRequest[] = items.map((item) => ({
      title: item.title,
      repository: item.repository_url.split('/').slice(-2).join('/'),
      summary: this.createSummary(item.body),
      url: item.html_url,
      status:
        item.state === 'open' ? 'open' : item.pull_request.merged_at ? 'merged' : 'closed',
    }));
    this.cache.set(username, {
      expiresAt: Date.now() + 60_000,
      pullRequests,
    });

    return pullRequests;
  }

  private createSummary(body: string | null): string {
    if (!body?.trim()) {
      return 'No pull request summary was provided.';
    }

    const summary = body
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\/?[a-z][^>]*>/gi, '')
      .replace(/!\[[^\]]*]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/(?<!\w)(_{1,2})(?=\S)([^_]*?\S)\1(?!\w)/g, '$2')
      .replace(/[*`]/g, '')
      .replace(/~~/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!summary) {
      return 'No pull request summary was provided.';
    }

    return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
  }
}
