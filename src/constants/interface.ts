export type Status = 'pending' | 'completed' | 'error' | 'idle';
export type NotificationKind = 'begin' | 'report' | 'end';
export type AutoScan = 'Enabled' | 'Disabled';

export interface ICodeScanResponse {
  status: Status;
  message?: string;
}

export interface IProgressMessageResponse {
  token: string;
  value: {
    kind: NotificationKind;
    message?: ICodeScanResponse;
    title?: string;
  };
}
