
import { inspect } from 'util';
import { get } from 'lodash';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

import {
  consoleLogger as Logger,
  S3,
  transcribeService,
  contactDetailsService,
  Voicemail,
  lambdaService,
} from '@mark-voicemail/common';

const region = process.env.REGION || 'ap-southeast-2';
const recordingsBucket = 'vm-voicemail-recordings';
const transcriptionBucket = 'vm-voicemail-transcriptions';

const processVideo = async (event: APIGatewayEvent): Promise<{ status: boolean, error: any }> => {
  try {
    const contactId = get(event, 'Details.ContactData.ContactId');
    const audio = get(event, 'Details.ContactData.MediaStreams.Customer.Audio');
    const streamName = audio.StreamARN.split('stream/')[1].split('/')[0];
    const fragmentNumber = audio.StartFragmentNumber;
    // const startTime = new Date(Number(audio.StartTimestamp));

    Logger.info('streamName:' + streamName);
    Logger.info('fragmentNumber:' + fragmentNumber);

    const connectVoiceMail = new Voicemail.ConnectVoiceMail();
    const wav = await connectVoiceMail.getWav(region, streamName, fragmentNumber);

    const key = `${contactId}/audio.wav`;
    Logger.info('---- wavFile Generagted ------',);

    const putObjectResult = await S3.putFile(recordingsBucket, key, Buffer.from(wav.buffer));
    Logger.info('---- wavFile Pushed to S3 ------',);

    Logger.info('putObjectResult', putObjectResult);
    return { status: true, error: null };

  } catch (error) {
    Logger.error('Error in processVideo', error);
    return { status: false, error }
  }
}

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  Logger.info(inspect(event, { depth: null }));

  /**
   * Initial DB entry for the contact
   */
  await contactDetailsService.updateDDBInitialContactEntry(event);
  Logger.info('---- DB Initial Entry Update completed ------');

  /**
   * Video strem process to get the audio and store to S3
   */
  const { status, error } = await processVideo(event);
  Logger.info('---- Audio Processing completed ------');

  if (!status && error) {
    Logger.error('Error Processing Lambda');
  }

  /**
   * Update db entry for the contact Id
   */
  await contactDetailsService.updateDDBAudioCompletedEntry(event);
  Logger.info('---- Audio Processing DB entry completed ------');

  // Invoke Transcribe Lambda further for transcription
  // --------------------------------------------------------------
  const contactId = get(event, 'Details.ContactData.ContactId');
  const fileName = 'audio.wav';
  const wavFile = `https://${recordingsBucket}.s3-${region}.amazonaws.com/${contactId}/${fileName}`;

  const invokeLambdaParams = {
    FunctionName: process.env.TRANSCRIBE_LAMBDA_ARN,
    InvocationType: 'Event',
    Payload: JSON.stringify({ contactId, wavFile, transcriptionBucket })
  };

  await lambdaService.invokeLambda(invokeLambdaParams);

  return {
    statusCode: 200
  }
};
