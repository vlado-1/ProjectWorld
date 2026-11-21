export interface GithubPullRequest {
  title: string;
  repository: string;
  summary: string;
  url: string;
  status: 'open' | 'merged' | 'closed';
}
