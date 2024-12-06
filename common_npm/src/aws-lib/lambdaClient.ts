
import { LambdaClient } from '@aws-sdk/client-lambda';

// Set the AWS Region.
const REGION = process.env.REGION || 'ap-southeast-2';

const lambdaClient = new LambdaClient({ region: REGION });

export { lambdaClient };