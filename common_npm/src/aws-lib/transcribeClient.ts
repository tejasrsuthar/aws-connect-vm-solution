const { TranscribeClient } = require("@aws-sdk/client-transcribe");

// Set the AWS Region.
const REGION = process.env.REGION || 'ap-southeast-2';

// Create an Amazon Transcribe service client object.
const transcribeClient = new TranscribeClient({ region: REGION });

export { transcribeClient };