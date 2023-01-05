
import color from '@mark-voicemail/common';

export const handler = (event) => {
  console.log('this is test');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: color.green,
      input: event,
    }, null, 2),
  }
};
