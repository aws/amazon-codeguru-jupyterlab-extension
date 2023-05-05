import os
import boto3
import sys

CODEGURU_REGIONS = [
    'eu-north-1',
    'ap-southeast-2',
    'us-east-1',
    'us-east-2',
    'us-west-2',
    'ap-northeast-1',
    'ap-southeast-1',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2'
]
DEFAULT_AWS_REGION = 'us-east-1'
session = boto3.Session()
session._loader.search_paths.extend([os.path.join(sys.prefix, "boto")])


def get_codeguru_security_client(overridden_region):
    aws_region = get_codeguru_supported_region(overridden_region)
    return session.client('codeguru-security',
                          endpoint_url="https://{}.prod.fe.codeguru-reviewer2.guru.aws.a2z.com".format(aws_region),
                          region_name=aws_region)


def get_codeguru_supported_region(overridden_region):
    aws_region = os.getenv("AWS_REGION")
    if is_codeguru_supported(aws_region) and overridden_region == DEFAULT_AWS_REGION:
        return aws_region
    return overridden_region or DEFAULT_AWS_REGION


def is_codeguru_supported(region):
    return region in set(CODEGURU_REGIONS)
