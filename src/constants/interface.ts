export type Status = 'pending' | 'completed' | 'error' | 'idle';
export type NotificationKind = 'begin' | 'report' | 'end';

export interface ICodeScanResponse {
  status: Status;
  message?: string;
  findingsCount?: number;
}

export interface IProgressMessageResponse {
  token: string;
  value: {
    kind: NotificationKind;
    message?: ICodeScanResponse;
    title?: string;
  };
}
