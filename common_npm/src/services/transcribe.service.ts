import { StartTranscriptionJobCommand, StartTranscriptionJobCommandOutput } from "@aws-sdk/client-transcribe";
import { transcribeClient } from './../aws-lib/transcribeClient';
import { consoleLogger as Logger } from './logger.service';

const startTranscriptionJob = async (contactId: string, fileURI: string, outputBucket: string): Promise<StartTranscriptionJobCommandOutput> => {

  if (!(contactId && fileURI && outputBucket)) {
    throw new Error('required contactId, file or outputBucket does not found');
  }

  const params = {
    TranscriptionJobName: `${contactId}`,
    LanguageCode: "en-US",
    MediaFormat: "wav",
    Media: {
      MediaFileUri: fileURI,
    },
    OutputBucketName: outputBucket
  };

  Logger.info('------ startTranscriptionJob:params:', params);
  const data = await transcribeClient.send(
    new StartTranscriptionJobCommand(params)
  );

  Logger.info(`------ doTranscription:transcription started for ${contactId} -------`, data);
  return data;
}

export {
  startTranscriptionJob
}