"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
`use strict`;
const uuid_1 = require("uuid");
const hello = (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('testevent:', (0, uuid_1.v4)());
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: (0, uuid_1.v4)(),
            input: event,
        }, null, 2),
    };
    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
});
exports.hello = hello;
//# sourceMappingURL=handler.js.map