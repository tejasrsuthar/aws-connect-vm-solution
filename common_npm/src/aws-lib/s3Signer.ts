import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type S3SignerRequest = {
  bucket: string;
  key: string;
  expiresSec: number;
}

export type S3SignerOutput = {
  preSignedUrl: string;
  expiresAt: Date;
}

export class S3Signer {
  private readonly s3Client: S3Client;
  private readonly getSignedUrl: typeof getSignedUrl;

  constructor(props: { s3Client: S3Client, getSignedUrl: typeof getSignedUrl }) {
    this.s3Client = props.s3Client;
    this.getSignedUrl = props.getSignedUrl;
  }

  async sign(s3SignerRequest: S3SignerRequest): Promise<S3SignerOutput> {
    const command = new GetObjectCommand({
      Bucket: s3SignerRequest.bucket,
      Key: s3SignerRequest.key
    });

    const expiresIn = s3SignerRequest.expiresSec;
    const preSignedUrl = await this.getSignedUrl(this.s3Client, command, { expiresIn });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return { preSignedUrl, expiresAt };
  }
}
