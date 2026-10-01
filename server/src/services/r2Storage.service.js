/**
 * Almacenamiento en Cloudflare R2 (API S3-compatible). Copiado de comunidad.
 *
 * Prefijo de objetos: `edm/examenes/{archivo}`
 *
 * Variables de entorno:
 * - R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME o R2_BUCKET
 * - R2_ENDPOINT
 * - R2_PUBLIC_BASE_URL
 */
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const KEY_PREFIX = 'edm/examenes/';

let s3Client;

const readConfig = () => {
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucket = String(process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || '').trim();
  const endpoint = String(process.env.R2_ENDPOINT || '').trim();
  const publicBase = String(process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  return { accessKeyId, secretAccessKey, bucket, endpoint, publicBase };
};

export const isR2Configured = () => {
  const c = readConfig();
  return !!(c.accessKeyId && c.secretAccessKey && c.bucket && c.endpoint && c.publicBase);
};

const getS3Client = () => {
  if (!s3Client) {
    const { accessKeyId, secretAccessKey, endpoint } = readConfig();
    s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3Client;
};

export const buildExamenObjectKey = ({ extension = 'webp' }) => {
  const ext =
    String(extension || 'webp')
      .replace(/^\./, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'webp';
  const stamp = Date.now();
  const rand = crypto.randomBytes(6).toString('hex');
  return `${KEY_PREFIX}examen-${stamp}-${rand}.${ext}`;
};

export const putObject = async ({ body, key, contentType = 'image/webp' }) => {
  const { bucket, publicBase } = readConfig();
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return { key, url: `${publicBase}/${key}` };
};
