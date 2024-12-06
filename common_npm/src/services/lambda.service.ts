
import { lambdaClient } from "../aws-lib/lambdaClient";
import { InvokeCommand, InvokeCommandInput, InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { consoleLogger as Logger } from "./logger.service";

const invokeLambda = async (options: InvokeCommandInput): Promise<InvokeCommandOutput> => {
  // @see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/interfaces/invokecommandinput.html

  /**
   *  ClientContext
      FunctionName // required
      InvocationType
      LogType
      Payload
      Qualifier
   */

  const input = {
    ...options
  }

  Logger.info('----- invokeLambda:input', input);
  const command = new InvokeCommand(input);

  return await lambdaClient.send(command);
}

export {
  invokeLambda
}