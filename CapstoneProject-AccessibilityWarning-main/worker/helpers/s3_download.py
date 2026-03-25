import os
import boto3


def get_s3_client():
    endpoint = os.getenv("AWS_S3_ENDPOINT")

    client_args = {
        "region_name": os.getenv("AWS_REGION"),
        "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
        "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
    }

    if endpoint:
        client_args["endpoint_url"] = endpoint

    return boto3.client("s3", **client_args)


def download_file_from_s3(bucket, key, local_path):
    s3 = get_s3_client()

    folder = os.path.dirname(local_path)
    if folder:
        os.makedirs(folder, exist_ok=True)

    s3.download_file(bucket, key, local_path)
    return local_path