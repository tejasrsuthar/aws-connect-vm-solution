import { get } from 'lodash';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

import {
  consoleLogger as Logger,
  S3,
  contactDetailsService,
  Voicemail,
  transcribeService
} from '@mark-voicemail/common';

const region = process.env.REGION;
const recordingsBucket = process.env.RECORDINGS_BUCKET;
const transcriptionBucket = process.env.TRANSCRIPTIONS_BUCKET;

const processVideo = async (event: APIGatewayEvent): Promise<{ status: boolean, error: any }> => {
  try {
    const contactId = get(event, 'Details.ContactData.ContactId');
    const audio = get(event, 'Details.ContactData.MediaStreams.Customer.Audio');
    const streamName = audio.StreamARN.split('stream/')[1].split('/')[0];
    const fragmentNumber = audio.StartFragmentNumber;

    Logger.info('streamName:' + streamName);
    Logger.info('fragmentNumber:' + fragmentNumber);

    const connectVoiceMail = new Voicemail.ConnectVoiceMail();
    const wav = await connectVoiceMail.getWav(region, streamName, fragmentNumber);

    const key = `${contactId}/audio.wav`;
    Logger.info('---- wavFile Generagted ------',);

    // store wav file to S3
    const putObjectResult = await S3.putFile(recordingsBucket, key, Buffer.from(wav.buffer));
    Logger.info('---- wavFile Pushed to S3 ------',);

    Logger.info('putObjectResult', putObjectResult);
    return { status: true, error: null };

  } catch (error) {
    Logger.error('Error in processVideo', error);
    return { status: false, error }
  }
}


export const handler = async (incomingEvent: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Incoming Event: ', JSON.stringify(incomingEvent, null, 2));

    const event = incomingEvent.event;
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

    // --------------------------------------------------------------
    const contactId = get(event, 'Details.ContactData.ContactId');
    const fileName = 'audio.wav';
    const wavFile = `https://${recordingsBucket}.s3-${region}.amazonaws.com/${contactId}/${fileName}`;

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
