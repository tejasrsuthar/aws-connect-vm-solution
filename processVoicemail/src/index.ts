import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  contactDetailsService,
  S3,
  mailerService,
  S3Signer
} from '@mark-voicemail/common';
import { get, split } from 'lodash';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

const recordingsBucket = process.env.BKT_RECORDINGS;
const SIGN_URL_EXPIRATION_SEC = Number(process.env.SIGN_URL_EXPIRATION_SEC) || 604800;
const VOICEMAIL_FILE = 'audio.wav';
const TRANSCRIPT_FILE = 'transcript.json';

const sendEmail = async ({ from, to, subject, context, template }: { from: string, to: string[], subject: string, context: object, template: string }): Promise<{ status: boolean, err: any, info: object }> => {
  return new Promise((resolve, reject) => {
    mailerService.sesTransporter.sendMail(
      {
        from,
        to,
        subject,
        template,
        context
      },
      (err: any, info: { envelope: string, messageId: string }) => {
        if (err) {
          console.error('ERR sending mail', err);
          return reject({ status: false, err });
        }
        console.log(info.envelope);
        console.log(info.messageId);
        return resolve({ status: true, err: null, info });
      }
    );
  });
}

export const getTranscript = async (contactId: string) => {
  let transcript = 'na';

  if (!contactId) {
    return transcript;
  }

  try {
    const transcriptFileJSON = await S3.getJsonFile(recordingsBucket, `${contactId}/${TRANSCRIPT_FILE}`);
    console.log('info', 'transcriptFileJSON', transcriptFileJSON);
    transcript = get(transcriptFileJSON, 'results.transcripts[0].transcript', 'na');
    console.info(`getTranscript:transcript:${transcript}`);

    return transcript;
  } catch (err) {
    console.error('getTranscript:error:', JSON.stringify(err));
    return transcript;
  }
};

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.info(`Incoming Event: ${JSON.stringify(event, null, 2)}`);
    const getContactId = (key: string): string => {
      // ex. key: 43aef394-c2b1-4d4f-b36b-cac3f37bdcce.json
      return split(key, '.')[0];
    }

    for await (const record of event.Records) {
      try {
        const transcriptionsBucket = get(record, 's3.bucket.name');
        const key = get(record, 's3.object.key');
        const contactId = getContactId(key);
        console.info(`debug:contactId: ${contactId}`);

        // get transcribed file & check status
        await contactDetailsService.updateDDBTranscribeCompletedEntry(contactId);
        console.info('------ Transcribe DB entry completed -----')

        // copy this file to recordings bucket
        await S3.copyFile(transcriptionsBucket, recordingsBucket, `${contactId}.json`, `${contactId}/${TRANSCRIPT_FILE}`);
        console.info('------ Transcription file copied to recordings bucket -----');

        // delete this file from transcriptions bucket
        await S3.deleteFile(transcriptionsBucket, key);
        console.info('------ Transcription source file deleted -----');

        const transcript = await getTranscript(contactId);
        const s3Client = new S3Client({ region: process.env.REGION });
        const signer = new S3Signer({ s3Client, getSignedUrl });
        const signerResponse = await signer.sign({ bucket: recordingsBucket, key: `${contactId}/${VOICEMAIL_FILE}`, expiresSec: SIGN_URL_EXPIRATION_SEC });

        console.log('handler:signerResponse', signerResponse);        
        const voicemailUrl = signerResponse.preSignedUrl;

        const signedUrlbase64 = Buffer.from(voicemailUrl, 'utf8').toString('base64');
        const playerURL = `${process.env.VOICEMAIL_PLAYER_URL}?plid=${signedUrlbase64}`;

        console.info(`---- voicemailUrl: ${voicemailUrl}`);
        const contactDetails = await contactDetailsService.getContactDetails(contactId);

        console.log('contactDetails', contactDetails);
        const { customerPhoneNumber, customerName, branchEmail } = contactDetails;

        const mailParams = {
          from: process.env.SES_EMAIL_FROM,
          to: branchEmail || split(process.env.SES_DEFAULT_EMAIL_TO, ','),
          subject: `New Voicemail from ${customerPhoneNumber} ${customerName}`,
          template: 'voicemail',
          context: {
            voicemailClientName: customerName,
            voicemailTranscript: transcript,
            voicemailLink: playerURL,
            customerName
          }
        };

        console.info('mailParams', mailParams);
        const { status } = await sendEmail(mailParams);

        if (status) {
          await contactDetailsService.updateDDBMailSentCompletedEntry(contactId);
        }

      } catch (error) {
        console.error(`Error occured while processing record ${JSON.stringify(record)}:error: ${JSON.stringify(error, null, 2)}`);
        continue;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  } catch (error) {
    console.error('something went wrong:error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({})
    };
  }
};
