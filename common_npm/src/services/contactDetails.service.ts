import { first, get, isEmpty } from 'lodash';
import { APIGatewayEvent } from 'aws-lambda';

import { ContactDetailsModel } from "../models/contactDetails";
import { consoleLogger as Logger } from "./logger.service";

const _getContactRecordByContactId = async (contactId: string) => {
  Logger.info(`----- fetching contact details by contactId ${contactId} ----`);
  return ContactDetailsModel.get(contactId);
}

/**
 * 
 * Model Functions
 */
const updateDDBInitialContactEntry = async (event: APIGatewayEvent): Promise<void> => {
  const fn = 'updateDDBInitialContactEntry';
  try {
    const customerPhoneNumber = get(event, 'Details.ContactData.CustomerEndpoint.Address');
    const contactId = get(event, 'Details.ContactData.ContactId');
    const { first_name: firstName, last_name: lastName } = get(event, 'Details.ContactData.Attributes');
    const { BranchEmail: branchEmail } = get(event, 'Details.ContactData.Attributes');
    const customerName = `${!isEmpty(firstName) ? firstName : ''} ${!isEmpty(lastName) ? lastName : ''}`;

    process.env.TZ = 'Australia/Sydney';
    const currentTimeStamp = new Date().toString();
    const currentDate = new Date().toLocaleDateString();

    const SECONDS_IN_SEVEN_DAYS = 604800;
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expirationTime = secondsSinceEpoch + SECONDS_IN_SEVEN_DAYS;

    // set up the database query to be used to update the customer information record in DynamoDB
    const paramsUpdate = {
      contactId,
      customerPhoneNumber,
      callDate: currentDate,
      callTimestamp: currentTimeStamp,
      audioProcessingCompleted: false,
      transcribeCompletd: false,
      emailSent: false,
      customerName,
      branchEmail,
      ttl: expirationTime,
    };

    Logger.info(`${fn}:paramsUpdate:`, paramsUpdate);
    const updateResponse = await ContactDetailsModel.update(paramsUpdate);
    Logger.info(`${fn}:success`, updateResponse);
  } catch (error) {
    Logger.error(`${fn}:Error:`, JSON.stringify(error));
  }
}

const updateDDBAudioCompletedEntry = async (event: APIGatewayEvent): Promise<void> => {
  const fn = 'updateDDBAudioCompletedEntry';
  try {
    const contactId = get(event, 'Details.ContactData.ContactId');
    const contactDetails = await _getContactRecordByContactId(contactId);

    const paramsUpdate = {
      ...contactDetails,
      audioProcessingCompleted: true
    }
    Logger.info(`${fn}:paramsUpdate:`, paramsUpdate);
    const updateResponse = await ContactDetailsModel.update(paramsUpdate);
    Logger.info(`${fn}:success:`, updateResponse);
  } catch (error) {
    Logger.error(`${fn}:error:`, JSON.stringify(error));
  }
}

const updateDDBTranscribeCompletedEntry = async (contactId: string): Promise<void> => {
  const fn = 'updateDDBTranscribeCompletedEntry';
  try {
    const contactDetails = await _getContactRecordByContactId(contactId);

    const paramsUpdate = {
      ...contactDetails,
      transcribeCompletd: true
    }

    Logger.info(`${fn}:paramsUpdate:`, paramsUpdate);
    const updateResponse = await ContactDetailsModel.update(paramsUpdate);
    Logger.info(`${fn}:success:`, updateResponse);
  } catch (error) {
    Logger.error(`${fn}:error:`, JSON.stringify(error));
  }
}

const updateDDBMailSentCompletedEntry = async (contactId: string): Promise<void> => {
  const fn = 'updateDDBMailSentCompletedEntry';
  try {
    const contactDetails = await _getContactRecordByContactId(contactId);

    const paramsUpdate = {
      ...contactDetails,
      emailSent: true
    }

    Logger.info(`${fn}:paramsUpdate:`, paramsUpdate);
    const updateResponse = await ContactDetailsModel.update(paramsUpdate);
    Logger.info(`${fn}:success:`, updateResponse);
  } catch (error) {
    Logger.error(`${fn}:error:`, JSON.stringify(error));
  }
}

const getContactDetails = async (contactId: string) => {
  return _getContactRecordByContactId(contactId);
}

export {
  updateDDBAudioCompletedEntry,
  updateDDBInitialContactEntry,
  updateDDBTranscribeCompletedEntry,
  updateDDBMailSentCompletedEntry,
  getContactDetails
}