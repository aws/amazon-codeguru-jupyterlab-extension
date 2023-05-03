import { ReactWidget } from '@jupyterlab/apputils';

import React from 'react';
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


 You currently do not have the necessary permissions needed to run a CodeGuru scan. [Learn more](#)

 Go to your [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) to update
 your execution policy for each user that will use this extension.

 Create an inline policy with following permissions:
 \`\`\`
 {
   "Version": "2012-10-17",
   "Statement": [
     {
       "Sid": "AmazonCodeGuruSecurityFullAccess",
       "Action": [
         "codeguru-security:*"
       ],
       "Effect": "Allow",
       "Resource": "*"
     }
   ]
 }
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
