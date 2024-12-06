interface Color {
  red: number;
  blue: number;
  green: number;
}

const color: Color = {
  red: 20,
  blue: 10,
  green: 10
};
 
export default color;
export * from './models/contactDetails';
export * as Helper from './helpers/date';
export * as S3 from './aws-lib/s3';
export * from './aws-lib/s3Signer';
export * as transcribeService from './services/transcribe.service';
export * as Voicemail from './services/connectVoicemail.service';
export * as contactDetailsService from './services/contactDetails.service';
export * as lambdaService from './services/lambda.service';
export * as mailerService from './services/nodemailer.service';