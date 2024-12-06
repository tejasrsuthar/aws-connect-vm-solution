let nodemailer = require("nodemailer");
let aws = require("@aws-sdk/client-ses");
let { defaultProvider } = require("@aws-sdk/credential-provider-node");
const hbs = require('nodemailer-express-handlebars');

const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: process.env.REGION || 'ap-southeast-2',
  defaultProvider,
});

// create Nodemailer SES transporter
let sesTransporter = nodemailer.createTransport({
  SES: { ses, aws },
});

// const options = {
//   extName: '.hbs', /* or '.handlebars' */
//   viewPath: __dirname + '/../views/email/',
//   layoutsDir: __dirname + '/../view/layouts',
//   defaultLayout: 'template',
//   partialsDir: __dirname + '/../views/email/partials/'
// }

const viewsFolder = require('path').resolve(`${__dirname}/../views/email`);

const options = {
  viewEngine: {
    extname: '.hbs', // handlebars extension
    layoutsDir: viewsFolder, // location of handlebars templates
    defaultLayout: false,
    partialsDir: viewsFolder, // location of your subtemplates aka. header, footer etc

  },
  viewPath: viewsFolder,
  extName: '.hbs',
}

sesTransporter.use('compile', hbs(options));


export { sesTransporter }