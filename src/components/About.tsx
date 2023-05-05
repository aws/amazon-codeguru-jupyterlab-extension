import { Container, Grid, Header } from '@cloudscape-design/components';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { ReactWidget } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import React from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { codeGuruSecurityScanAccessPolicy } from '../constants/policy';
import { isLightThemeActive } from '../utils';

export class AboutCodeGuru extends ReactWidget {
  render(): JSX.Element {
    const steps = [
      {
        header: 'Step 1: Provide necessary permissions',
        description: `Go to the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) to update the permissions policy for each user that will use this extension. Use an AWS managed policy or create a policy with the following permissions:

\`\`\`
${codeGuruSecurityScanAccessPolicy}
\`\`\`
`
      },
      {
        header: 'Step 2: Configure credentials',
        headerDescription:
          'This will only required for users running jupyter lab outside AWS SageMaker.',
        description: `Refresh your AWS credentials using the AWS CLI. Run the following command to update your AWS configuration:

\`\`\`
aws configure
\`\`\`
`
      }
    ];

    return (
      <Box
        padding="xxl"
        className={`about-codeguru ${
          isLightThemeActive() ? '' : 'awsui-dark-mode'
        }`}
      >
        <SpaceBetween direction="vertical" size="m">
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
                Once you install this extension, you must complete these steps
                to begin scanning your code.
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
              <Markdown
                content={`
## Pricing

The cost of the CodeGuru extension is determined by the frequency of scans in your notebook file. By default, scans run every 120 seconds. To understand how this impacts billing, visit our [pricing policy]("#"). You can change the frequency of scans in the Advanced Settings Editor.
              `}
              />
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
