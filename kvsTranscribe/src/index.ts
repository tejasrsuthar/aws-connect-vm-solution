import {
  consoleLogger as Logger,
  transcribeService,
} from '@mark-voicemail/common';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Logger.info('Incoming Event: ', JSON.stringify(event, null, 2));
    Logger.info('incoming event type', event);
    const { contactId, wavFile, transcriptionBucket } = event;

    // Start transcription process
    await transcribeService.startTranscriptionJob(contactId, wavFile, transcriptionBucket);

    return {
      statusCode: 200,
    };
  } catch (error) {
    Logger.error('something went wrong:error:', error);

    return {
      statusCode: 500,
    };
  }

};
