import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://127.0.0.1:4566', // LocalStack / MinIO
  forcePathStyle: true, // Necessário para s3 locais (AWS Local)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
})
