import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

let s3Client: any = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = true,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/products/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}products/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    // Don't set ContentDisposition here to avoid requiring matching header in upload
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600, // 1 hour
  });

  return { uploadUrl, cloud_storage_path };
}

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic = true,
): Promise<string> {
  const { bucketName } = getBucketConfig();
  const client = getS3Client();
  const region = await client.config.region();

  if (isPublic) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  // For private files, generate signed URL
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function deleteFile(
  cloud_storage_path: string,
): Promise<void> {
  const { bucketName } = getBucketConfig();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await getS3Client().send(command);
}
