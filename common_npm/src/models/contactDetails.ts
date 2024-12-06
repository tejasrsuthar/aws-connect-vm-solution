import { dynamoose } from "../services/dynamoose.service";
import { Item } from "dynamoose/dist/Item";
import { consoleLogger as Logger } from "../services/logger.service";

class ContactDetails extends Item {
  contactId!: string;
  customerPhoneNumber!: string;
  callDate!: string;
  callTimestamp!: string;
  audioProcessingCompleted!: boolean;
  transcribeCompletd!: boolean;
  emailSent!: boolean;
  customerName!: string;
  branchEmail!: string;
  ttl!: number;
}

const schema = {
  "contactId": String,
  "customerPhoneNumber": String,
  "callDate": String,
  "callTimestamp": String,
  "audioProcessingCompleted": Boolean,
  "transcribeCompletd": Boolean,
  "emailSent": Boolean,
  "customerName": String,
  "branchEmail": String,
  "ttl": Number,
}

let ContactDetailsModel: any;

try {
  const contactDetailsTable = process.env.TBL_CONTACT_DETAILS as string;
  const options = {
    create: false,
  };

  ContactDetailsModel = dynamoose.model<ContactDetails>(contactDetailsTable, schema, options);
  Logger.info('model vmContactDetails is loaded');
} catch (error) {
  Logger.error('error loading model vmContactDetails error', error);
}


export { ContactDetailsModel };