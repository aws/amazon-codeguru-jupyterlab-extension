import { ReactWidget } from '@jupyterlab/apputils';

import React from 'react';
import { codeGuruSecurityScanAccessPolicy } from '../constants/policy';
import { Markdown } from './About';

export enum ErrorType {
  INSUFFICIENT_ACCESS_PERMISSIONS = 'INSUFFICIENT_ACCESS_PERMISSIONS',
  MISSING_AWS_CREDENTIALS = 'MISSING_AWS_CREDENTIALS'
}

interface ICodeScanError {
  errorType: ErrorType;
}

const CodeScanErrorComponent = ({ errorType }: ICodeScanError): JSX.Element => {
  const missingPermissionsContent = `
 ### Missing permissions for CodeGuru extension


 You do not have the necessary permissions to run a CodeGuru scan. [Learn more](#)

Go to the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) to update the permissions policy for each user that will use this extension.

Use an AWS managed policy or create a policy with the following permissions:

 \`\`\`
${codeGuruSecurityScanAccessPolicy}
 \`\`\`
   `;

  const missingCredentialsContent = `
 ### Missing AWS credentials for CodeGuru extension


 To use Amazon CodeGuru scan, provide AWS credentials by pasting

 the following script in your command prompt window.

 \`\`\`
 aws configure
 \`\`\`
   `;

  return (
    <div className="cg-popover">
      <div className="cg-popover-content cg-text">
        <Markdown
          content={
            errorType === ErrorType.INSUFFICIENT_ACCESS_PERMISSIONS
              ? missingPermissionsContent
              : missingCredentialsContent
          }
        />
      </div>
    </div>
  );
};

export class CodeScanErrorWidget extends ReactWidget {
  errorType: ErrorType;
  constructor(props: ICodeScanError) {
    super();
    this.addClass('jp-ReactWidget');
    this.errorType = props.errorType;
  }

  render(): JSX.Element {
    return <CodeScanErrorComponent errorType={this.errorType} />;
  }
}
