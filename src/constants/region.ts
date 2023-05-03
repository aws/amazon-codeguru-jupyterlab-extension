export enum Region {
  // Wave 1
  ARN = 'eu-north-1',
  // Wave 2
  SYD = 'ap-southeast-2',
  // Wave 3
  IAD = 'us-east-1',
  CMH = 'us-east-2',
  PDX = 'us-west-2',
  // Wave 4
  NRT = 'ap-northeast-1',
  SIN = 'ap-southeast-1',
  FRA = 'eu-central-1',
  DUB = 'eu-west-1',
  LHR = 'eu-west-2'
}

export const DEFAULT_AWS_REGION = Region.IAD;
