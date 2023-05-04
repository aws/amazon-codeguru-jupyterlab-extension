import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Header from '@cloudscape-design/components/header';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { isLightThemeActive } from '../utils';

const steps = [
  {
    header: 'Step 1: Provide necessary permissions',
    description: `Go to your [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) to update your execution policy for each user that will use this extension. Create an inline policy with following permissions:
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
  `
  },
  {
    header: 'Step 2: Configure credentials',
    headerDescription:
      'This will only required for users running jupyter lab outside AWS SageMaker.',
    description: `Refresh your AWS credentials using AWS CLI. Run following command to update AWS configuration.

  \`\`\`
  aws configure
\`\`\`
`
  }
];

export class AboutCodeGuru extends ReactWidget {
  render(): JSX.Element {
    return (
      <Box
        padding="xxl"
        className={`about-codeguru ${
          isLightThemeActive() ? '' : 'awsui-polaris-dark-mode'
        }`}
      >
        <SpaceBetween direction="vertical" size="s">
          <Box variant="h1">Amazon CodeGuru extension</Box>
          <ColumnLayout borders="horizontal" columns={1}>
            <Box>
              <Box variant="h2">About</Box>
              <Box variant="p">
                <Markdown
                  content={`This extension scans code, detects security vulnerabilities, and
	                 recommends code quality improvements, helping you to create and
	                 deploy secure, high quality ML models. With this new feature,
	                 you can quickly identify vulnerable lines of code and
	                 inefficient machine learning methods within a notebook. In
	                 addition, you will get recommendations that clearly show how to
	                 fix the identified vulnerabilities and improve the ML methods.
	                 [Learn more]("#")`}
                />
              </Box>
            </Box>
            <Box>
              <Box variant="h2">Activating CodeGuru scan</Box>
              <Box variant="p">
                Once you install this extension, you have to complete 3 steps
                for it to begin scanning your code.
              </Box>
              <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
                {steps.map(step => (
                  <Container
                    header={
                      <Header variant="h2" description={step.headerDescription}>
                        {step.header}
                      </Header>
                    }
                    fitHeight={true}
                  >
                    <Markdown content={step.description} />
                  </Container>
                ))}
              </Grid>
            </Box>
            <Box>
              <Box variant="h2">Pricing</Box>
              <Box variant="p">
                The cost is determined by the frequency of scans performed in
                your notebook. By default, CodeGuru scans will be triggered
                after every 120 seconds interval. To understand our pricing
                mechanism and change scan settings to best suit your needs see
                our{' '}
                <Link external href="#">
                  pricing policy
                </Link>
                . You can change the scan frequency from Advanced Settings
                Editor. The number of times a scan is performed in your notebook
                determines the cost.
              </Box>
            </Box>
          </ColumnLayout>
        </SpaceBetween>
      </Box>
    );
  }
}

interface IMarkdown {
  content: string;
}
export function Markdown({ content }: IMarkdown): JSX.Element {
  return (
    <ReactMarkdown
      components={{
        a: ({ children, href }) => (
          <Link external href={href}>
            {children}
          </Link>
        ),
        code: ({ children }) => (
          <pre>
            <div className="jp-InputArea-editor cg-code-editor">
              <code>{children}</code>
            </div>
            <div>
              <Button
                className="cg-button"
                onClick={() => copyToClipboard(children as string)}
              >
                Copy
              </Button>
            </div>
          </pre>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function copyToClipboard(text: string | undefined) {
  return navigator.clipboard.writeText(text as string);
}
