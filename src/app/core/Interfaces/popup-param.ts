export type PopupKind = 'standard' | 'video' | 'github';

export interface PopupParam {
  title: string;
  content: string;
  visible: boolean;
  kind: PopupKind;
  videoSrc?: string;
  githubUser?: string;
}