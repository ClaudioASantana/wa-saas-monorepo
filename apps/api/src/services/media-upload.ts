import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../config/s3'
import { Readable } from 'stream'
import { utcNow } from '../utils/time'

function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf'
  }
  return map[mimeType] || 'bin'
}

// Mock/Fetch da Graph API da Meta
async function getMetaMediaUrl(mediaId: string): Promise<string> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) {
    // Para modo dev/local, simulamos uma URL de download dummy se não houver token
    return `https://dummyjson.com/image/150` 
  }
  
  const res = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!res.ok) {
    throw new Error(`Failed to fetch media url from Meta: ${res.statusText}`)
  }
  
  const data = (await res.json()) as { url: string }
  return data.url
}

export async function uploadMediaToS3(params: {
  tenantId: string
  messageId: string
  mediaId: string
  mimeType: string
}): Promise<string> {
  // 1. Obter URL de download da Meta API
  const mediaUrl = await getMetaMediaUrl(params.mediaId)

  // 2. Stream download -> S3 (piping do body stream diretamente)
  const token = process.env.META_ACCESS_TOKEN
  const fetchOptions = token && mediaUrl.includes('fbcdn.net') 
    ? { headers: { Authorization: `Bearer ${token}` } } 
    : {}
    
  const response = await fetch(mediaUrl, fetchOptions)
  
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download media stream: ${response.statusText}`)
  }
  
  const stream = Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream)

  const ext = mimeToExtension(params.mimeType)
  const now = utcNow()
  const key = [
    params.tenantId,
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    `${params.messageId}.${ext}`,
  ].join('/')

  const bucket = process.env.AWS_S3_BUCKET || 'wa-saas-media'

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: stream,
    ContentType: params.mimeType,
  }))

  const endpoint = process.env.AWS_ENDPOINT || 'http://127.0.0.1:4566'
  // Para ambiente local (forcePathStyle) a URL é endpoint/bucket/key
  // Em produção seria https://bucket.s3.region.amazonaws.com/key
  const isLocal = process.env.NODE_ENV !== 'production'
  
  if (isLocal) {
    return `${endpoint}/${bucket}/${key}`
  }
  
  return `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
}
