const Actuals = require('./services/actuals');
const Forecasts = require('./services/forecasts');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();
AWS.config.update({ region: process.env.AWS_REGION });

async function processEvent() {
  try {

    return "All tasks done";
  } catch (e) {
    console.log('Error thrown!')
    console.log(e);
    
    throw e;
  }
}

async function main() {
  // probably we would decrypt the environment variables in lambda here in the future
  return await processEvent();
}

module.exports.handler = main;