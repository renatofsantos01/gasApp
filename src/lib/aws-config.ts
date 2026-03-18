import { S3Client } from '@aws-sdk/client-s3';

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? '',
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? '',
    publicUrl: process.env.AWS_PUBLIC_URL ?? '',
  };
}

export function createS3Client() {
  const endpoint = process.env.AWS_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION ?? 'auto';

  return new S3Client({
    region,
    ...(endpoint && { endpoint }),
    ...(accessKeyId && secretAccessKey && {
      credentials: { accessKeyId, secretAccessKey },
    }),
  });
}
