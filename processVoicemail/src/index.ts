import {
  consoleLogger as Logger,
  transcribeService,
} from '@mark-voicemail/common';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    Logger.log('Incoming Event: ', JSON.stringify(event, null, 2));

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
