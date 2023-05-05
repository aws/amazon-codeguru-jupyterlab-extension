export const codeGuruSecurityScanAccessPolicy = `
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmazonCodeGuruSecurityScanAccess",
      "Effect": "Allow",
      "Action": [
        "codeguru-security:CreateScan",
        "codeguru-security:CreateUploadUrl",
        "codeguru-security:GetScan",
        "codeguru-security:GetFindings"
      ],
      "Resource": "*"
    }
  ]
}
`;
