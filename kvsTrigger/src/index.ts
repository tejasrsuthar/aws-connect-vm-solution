import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

import {
  contactDetailsService,
  lambdaService,
} from '@mark-voicemail/common';

let response;

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {

    console.info(event);

    await contactDetailsService.updateDDBInitialContactEntry(event);
    console.info('---- DB Initial Entry Update completed ------');

    const invokeLambdaParams = {
      FunctionName: process.env.TRANSCRIBE_LAMBDA_ARN,
      InvocationType: 'Event',
      Payload: JSON.stringify({ event })
    };
    await lambdaService.invokeLambda(invokeLambdaParams);
  } catch (err) {
    console.log(err);
  }

  response = {
    'statusCode': 200,
    'body': JSON.stringify({
      message: 'done',
    })
  };

  return response;
};
