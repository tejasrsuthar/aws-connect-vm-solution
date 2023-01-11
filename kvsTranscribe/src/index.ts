`use strict`

import color from '@mark-voicemail/common';

export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: color.red,
        input: event,
      },
      null,
      2
    ),
  };
  // testing
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
