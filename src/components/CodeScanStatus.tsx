import Box from '@cloudscape-design/components/box';
import Icon from '@cloudscape-design/components/icon';
import Spinner from '@cloudscape-design/components/spinner';
import { ReactWidget } from '@jupyterlab/apputils';
import { GroupItem, Popup, TextItem, showPopup } from '@jupyterlab/statusbar';
import { ISignal } from '@lumino/signaling';
import React, { useState } from 'react';
import {
  missingPermissionsOrCredsIconRed,
  missingPermissionsOrCredsIconWhite
} from '../constants/icons';
import { ICodeScanResponse, Status } from '../constants/interface';
import { isLightThemeActive } from '../utils';
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
    case 'pending':
      return (
        <Box>
          <Spinner className="statusbar-spinner" />
          CodeGuru: Scan in progress
        </Box>
      );
    case 'error': {
      const errorType = parseError(String(message));
      const title =
        errorType === ErrorType.INSUFFICIENT_ACCESS_PERMISSIONS
          ? 'CodeGuru: Missing permissions'
          : 'CodeGuru: Scan failed';
      return (
        <GroupItem
          spacing={4}
          title={title}
          onClick={() => props.handleClick(errorType)}
        >
          {isLightThemeActive() ? (
            <missingPermissionsOrCredsIconRed.react top={'2px'} title={title} />
          ) : (
            <missingPermissionsOrCredsIconWhite.react
              top={'2px'}
              title={title}
            />
          )}
          <TextItem source={title} />
        </GroupItem>
      );
    }
    case 'completed':
      return (
        <Box>
          <Icon name="check" className="statusbar-icon" />
          CodeGuru: Scan completed
        </Box>
      );
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

function parseError(message: string | undefined) {
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
    message.includes('UnrecognizedClientException') &&
    message.includes('The security token included in the request is invalid')
  ) {
    return ErrorType.MISSING_AWS_CREDENTIALS;
  }
  return;
}
