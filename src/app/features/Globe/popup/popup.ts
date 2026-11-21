import { ChangeDetectorRef, Component } from '@angular/core';
import { PopupParam } from '../../../core/Interfaces/popup-param';
import { PopupToggle } from '../../../core/Services/popup-toggle';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Github } from '../../../core/Services/github';
import { GithubPullRequest } from '../../../core/Interfaces/github-pull-request';

@Component({
  selector: 'app-popup',
  imports: [CommonModule],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
})
export class Popup {
  data: PopupParam = {
    title: '',
    content: '',
    visible: false,
    kind: 'standard',
  };
  githubPullRequests: GithubPullRequest[] = [];
  githubLoading = false;
  githubError = '';
  popupToggle: PopupToggle;

  constructor(
    private pt: PopupToggle,
    private sanitizer: DomSanitizer,
    private github: Github,
    private changeDetector: ChangeDetectorRef,
  ) {
    pt.popupSubject.subscribe((pData: PopupParam) => {
      this.data = pData;
      if (pData.visible && pData.kind === 'github' && pData.githubUser) {
        this.loadGithubPullRequests(pData.githubUser);
      }
    });
    this.popupToggle = pt;
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  closePopup(): void {
    this.data.visible = false;
    this.popupToggle.togglePopup(this.data);
  }

  private async loadGithubPullRequests(username: string): Promise<void> {
    this.githubPullRequests = [];
    this.githubLoading = true;
    this.githubError = '';

    try {
      this.githubPullRequests = await this.github.getPullRequests(username);
    } catch (error) {
      this.githubError = error instanceof Error ? error.message : 'Unable to load GitHub data.';
    } finally {
      this.githubLoading = false;
      this.changeDetector.markForCheck();
    }
  }
}
