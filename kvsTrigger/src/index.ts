
import { inspect } from 'util';
import { get, omit } from 'lodash';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

import { ConnectVoiceMail } from './connectVoicemail';
import {
  consoleLogger as Logger, ContactDetailsModel,
  updateDDBAudioCompletedEntry, updateDDBInitialContactEntry,
  S3
} from '@mark-voicemail/common';

const region = process.env.REGION || 'ap-southeast-2';
const recordingsBucket = 'vm-voicemail-recordings';

// Import the required AWS SDK clients and commands for Node.js
import { StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";


// const dateString = (date: Date) => {
//   const year = date.getFullYear();
//   const mon = (date.getMonth() + 1);
//   const day = date.getDate();
//   const hour = date.getHours();
//   const min = date.getMinutes();

//   const space = (n: number) => {
//     return ('0' + (n)).slice(-2)
//   }

//   let result = year + '-';
//   result += space(mon) + '-';
//   result += space(day) + '_';
//   result += space(hour) + ':';
//   result += space(min);
//   return result;
// }

const processVideo = async (event: APIGatewayEvent): Promise<{ status: boolean, error: any }> => {
  try {
    const contactId = get(event, 'Details.ContactData.ContactId');
    const audio = get(event, 'Details.ContactData.MediaStreams.Customer.Audio');
    const streamName = audio.StreamARN.split('stream/')[1].split('/')[0];
    const fragmentNumber = audio.StartFragmentNumber;
    // const startTime = new Date(Number(audio.StartTimestamp));

    Logger.info('streamName:' + streamName);
    Logger.info('fragmentNumber:' + fragmentNumber);

    const connectVoiceMail = new ConnectVoiceMail();
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
  await updateDDBInitialContactEntry(event);
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
  await updateDDBAudioCompletedEntry(event);
  Logger.info('---- Audio Processing DB entry completed ------');

  // Invoke Transcribe Lambda further 
  // --------------------------------------------------------------

  const { TranscribeClient } = require("@aws-sdk/client-transcribe");
  const transcribeClient = new TranscribeClient({ region });

  const contactId = get(event, 'Details.ContactData.ContactId');
  const fileName = 'audio.wav';
  const wavFile = `https://${recordingsBucket}.s3-${region}.amazonaws.com/${contactId}/${fileName}`;

  const params = {
    TranscriptionJobName: `transcript-${contactId}`,
    LanguageCode: "en-US",
    MediaFormat: "wav",
    Media: {
      MediaFileUri: wavFile,
    },
    OutputBucketName: recordingsBucket
  };

  try {
    const data = await transcribeClient.send(
      new StartTranscriptionJobCommand(params)
    );
    console.log("Success - put", data);
    return data;
  } catch (err) {
    console.log("Error", err);
  }

  return {
    statusCode: 200
  }
};
