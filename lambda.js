const Actuals = require('./services/actuals');
const Forecasts = require('./services/forecasts');
const AWS = require('aws-sdk');
const moment = require('moment');
const dotenv = require('dotenv');

dotenv.config();
AWS.config.update({ region: process.env.DEFAULT_AWS_REGION });

const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({ region: process.env.S3_AWS_REGION });
const cloudfront = new AWS.CloudFront();

async function processEvent() {
  try {
    // Actuals
    // Substract one day because of the delay of actual data
    {
      const result = await Actuals.actualsExtract([moment().subtract(1, 'day').format('YYYYMM')]);
      await ddb.putItem({
        TableName: 'actuals-extract',
        Item: {
          month: AWS.DynamoDB.Converter.input(result[0].month),
          dayData: AWS.DynamoDB.Converter.input(result[0].dayData)
        }
      }).promise();

      const transformedResult = Actuals.actualsTransform(result);
      for (let i = 0; i < transformedResult.length; i += 25) {
        await ddb.batchWriteItem({
          RequestItems: {
            "actuals-transform": transformedResult.slice(i, i + 25).map(r => 
              ({
                PutRequest: {
                  Item: {
                    date: AWS.DynamoDB.Converter.input(r.date),
                    rain: AWS.DynamoDB.Converter.input(r.rain)
                  }
                }
              })
            )
          }
        }).promise();
      }
    }

    // Forecasts 
    {
      const result = await Forecasts.forecastsExtractCurrent();
      await ddb.putItem({
        TableName: 'forecasts-extract',
        Item: {
          date: AWS.DynamoDB.Converter.input(result.date),
          forecast: AWS.DynamoDB.Converter.input(result.forecast)
        }
      }).promise();

      const transformedResult = Forecasts.forecastsTransform([result]);
      await ddb.putItem({
        TableName: 'forecasts-transform',
        Item: {
          date: AWS.DynamoDB.Converter.input(transformedResult[0].date),
          rain: AWS.DynamoDB.Converter.input(transformedResult[0].rain)
        }
      }).promise();
    }

    // Load
    const forecasts = (await ddb.scan({
      TableName: 'forecasts-transform',
    }).promise()).Items.map(item => ({
      date: AWS.DynamoDB.Converter.output(item.date),
      rain: AWS.DynamoDB.Converter.output(item.rain),
    }));

    const actuals = (await ddb.scan({
      TableName: 'actuals-transform',
    }).promise()).Items.map(item => ({
      date: AWS.DynamoDB.Converter.output(item.date),
      rain: AWS.DynamoDB.Converter.output(item.rain),
    }));

    await s3.putObject({
      ACL: 'public-read',
      Body: JSON.stringify(forecasts),
      Bucket: process.env.S3_BUCKET,
      Key: 'forecasts-transform.json'
    }).promise()

    await s3.putObject({
      ACL: 'public-read',
      Body: JSON.stringify(actuals),
      Bucket: process.env.S3_BUCKET,
      Key: 'actuals-transform.json'
    }).promise()

    await cloudfront.createInvalidation({
      DistributionId: process.env.CLOUDFRONT_ID,
      InvalidationBatch: {
        CallerReference: Date.now() + '',
        Paths: { 
          Quantity: 1,
          Items: [
            '/*'
          ]
        }
      }
    }).promise();

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

if (process.env.LOCAL_TEST) {
  main();
}

module.exports.handler = main;