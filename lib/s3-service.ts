import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME!}

  // Upload file to S3
  async uploadFile(file: File, key: string): Promise<string> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);
      
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`} catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3')}
  }

  // Generate presigned URL for secure access
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn })} catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL')}
  }

  // Delete file from S3
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command)} catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3')}
  }

  // Generate unique file key
  generateFileKey(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    return `resumes/${userId}/${timestamp}_${randomString}.${extension}`}
}

export const s3Service = new S3Service();