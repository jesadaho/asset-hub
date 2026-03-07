import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getS3Client(): S3Client | null {
  const region = process.env.AWS_REGION;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKey?.trim() || !secretKey?.trim()) return null;
  return new S3Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

export async function getPresignedGetUrl(key: string): Promise<string | null> {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) return null;
  const client = getS3Client();
  if (!client) return null;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<boolean> {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) return false;
  const client = getS3Client();
  if (!client) return false;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return true;
}
