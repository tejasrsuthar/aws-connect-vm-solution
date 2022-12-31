`use strict`

import { v4 as uuidv4 } from 'uuid';

export const hello = async (event) => {

  console.log('testevent:', uuidv4());

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: uuidv4(),
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
