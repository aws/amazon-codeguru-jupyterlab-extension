import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { ReactWidget } from '@jupyterlab/apputils';
import { Popup, TextItem, showPopup } from '@jupyterlab/statusbar';
import { ISignal } from '@lumino/signaling';
import React, { useState } from 'react';
import { ICodeScanResponse, Status } from '../constants/interface';
import { CreateCodeScanButtonExtension } from './CodeScanButton';
import { CodeScanErrorWidget, ErrorType } from './CodeScanErrorPopup';

const statusCleanupTimeout: Record<Exclude<Status, 'pending'>, number> = {
  completed: 5000,
  error: 30000,
  idle: 0
};
interface ICodeScanStatusWidget extends ICodeScanResponse {
  listener: ISignal<CreateCodeScanButtonExtension, ICodeScanResponse>;
}
interface ICodeScanStatusComponent extends ICodeScanStatusWidget {
  handleClick: (errorType?: ErrorType) => void;
}

function CodeScanStatusComponent(props: ICodeScanStatusComponent): JSX.Element {
  const [status, setStatus] = useState(props.status);
  const [message, setMessage] = useState<string | undefined>();

  props.listener.connect((_, { status, message }) => {
    if (status !== 'pending') {
      setTimeout(() => {
        setStatus('idle'); // It will remove the status from footer
      }, statusCleanupTimeout[status]);
    }
    setStatus(status);
    setMessage(message);
  });

  switch (status) {
    case 'pending': {
      const title = 'CodeGuru: Scan in progress';
      return (
        <StatusIndicator type="in-progress" colorOverride="blue">
          <TextItem source={title} />
        </StatusIndicator>
      );
    }
    case 'error': {
      const errorType = parseError(String(message));
      const title =
        errorType === ErrorType.INSUFFICIENT_ACCESS_PERMISSIONS
          ? 'CodeGuru: Missing permissions'
          : errorType === ErrorType.MISSING_AWS_CREDENTIALS
          ? 'CodeGuru: Missing credentials'
          : 'CodeGuru: Scan failed';
      return (
        <div onClick={() => props.handleClick(errorType)}>
          <StatusIndicator type="warning">
            <TextItem source={title} />
          </StatusIndicator>
        </div>
      );
    }
    case 'completed': {
      const title = 'CodeGuru: Scan completed';
      return (
        <StatusIndicator type="success" colorOverride="blue">
          <TextItem source={title} />
        </StatusIndicator>
      );
    }
    case 'idle':
    default:
      return <></>;
  }
}

export class CodeScanStatus extends ReactWidget {
  protected status: Status;
  protected listener: ISignal<CreateCodeScanButtonExtension, ICodeScanResponse>;
  protected _popup: Popup | null = null;
  constructor(props: ICodeScanStatusWidget) {
    super();
    this.status = props.status;
    this.listener = props.listener;
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(errorType?: ErrorType): void {
    if (!errorType) {
      return;
    }
    if (this._popup?.isVisible) {
      this._popup.close();
    } else {
      if (this._popup) {
        this._popup.dispose();
      }
      this._popup = showPopup({
        body: new CodeScanErrorWidget({ errorType }),
        anchor: this,
        align: 'left'
      });
    }
  }

  render(): JSX.Element {
    return (
      <CodeScanStatusComponent
        status={this.status}
        listener={this.listener}
        handleClick={this.handleClick}
      />
    );
  }
}

export function parseError(message: string | undefined) {
  if (!message) {
    return;
  }

  if (
    message.includes('AccessDeniedException') &&
    message.includes('not authorized to perform: codeguru-security')
  ) {
    return ErrorType.INSUFFICIENT_ACCESS_PERMISSIONS;
  }

  if (
    (message.includes('UnrecognizedClientException') ||
      message.includes('ExpiredTokenException')) &&
    message.includes('The security token included in the request is ')
  ) {
    return ErrorType.MISSING_AWS_CREDENTIALS;
  }
  return;
}
