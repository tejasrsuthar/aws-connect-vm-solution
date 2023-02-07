import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { isEmpty } from 'lodash';
import * as AWS from 'aws-sdk';

import {
  contactDetailsService,
  lambdaService,
} from '@mark-voicemail/common';

const dbInitialEntry = async (decodedRecord) => {
  try {
    const { ContactId: contactId } = decodedRecord;
    const customerPhoneNumber = decodedRecord.CustomerEndpoint.Address;
    const { first_name: firstName, last_name: lastName, BranchEmail: branchEmail } = decodedRecord.Attributes;
    const customerName = `${!isEmpty(firstName) ? firstName : ''} ${!isEmpty(lastName) ? lastName : ''}`;

    const initialEntryParams = {
      customerPhoneNumber,
      contactId,
      firstName,
      lastName,
      branchEmail,
      customerName
    };
    await contactDetailsService.updateDDBInitialContactEntry(initialEntryParams);
  } catch (error) {
    console.error('dbInitialEntry:error:', error);
  }
};

const invokeLambda = async (decodedRecord) => {
  const lambdaParams = {
    FunctionName: process.env.TRANSCRIBE_LAMBDA_ARN,
    InvocationType: 'Event',
    Payload: JSON.stringify({ event: decodedRecord })
  };
  await lambdaService.invokeLambda(lambdaParams);
}

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  let { Records } = event;
  let promises = Records.map(async (record) => {
    try {
      const base64Data = record.kinesis.data;

      const decodedRecord = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8'));
      const { DisconnectReason } = decodedRecord;
      console.log('Record:', decodedRecord);

      // only process further in case of customer disconnect or contact flow disconnect
      if (!['CONTACT_FLOW_DISCONNECT', 'CUSTOMER_DISCONNECT'].includes(DisconnectReason)) {
        console.log('hanler:DisconnectReason:returning:', DisconnectReason);
        return;
      }

      console.log('processing db entry');
      await dbInitialEntry(decodedRecord);
      console.info('---- DB Initial Entry Update completed ------');

      await invokeLambda(decodedRecord);
      console.info('---- Transcribe lambda invoked ------');
    } catch (error) {
      console.error('records:loop:error:', error);
      return;
    }
  });

  try {
    let result = await Promise.all(promises);
    return {
      lambdaResult: "success"
    };
  } catch (error) {
    console.log(error);
    return {
      error: error
    };
  }
};
