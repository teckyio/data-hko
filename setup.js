const Actuals = require('./services/actuals-areas');
const Forecasts = require('./services/forecasts');
const AWS = require('aws-sdk');
const moment = require('moment');
const dotenv = require('dotenv');

dotenv.config();
AWS.config.update({ region: process.env.DEFAULT_AWS_REGION });

const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

// Actuals Extract
if (process.env.SKIP_ACTUALS_EXTRACT == null) {
  (async () => {
    const result = await Actuals.actualsExtract('2019-01-01');
    for (let i = 0; i < result.length; i += 25) {
      await ddb.batchWriteItem({
        RequestItems: {
          "actuals-areas-extract": result.slice(i, i + 25).map(r => 
            ({
              PutRequest: {
                Item: {
                  key: AWS.DynamoDB.Converter.input(r.key),
                  date: AWS.DynamoDB.Converter.input(r.date),
                  hour: AWS.DynamoDB.Converter.input(r.hour),
                  area: AWS.DynamoDB.Converter.input(r.area),
                  rain: AWS.DynamoDB.Converter.input(r.rain)
                }
              }
            })
          )
        }
      }).promise();
    }
  })()
}
  
// Actuals Transform
if (process.env.SKIP_ACTUALS_TRANSFORM == null) {
  (async () => {
    const data = await ddb.scan({
      TableName: 'actuals-areas-extract',
    }).promise();

    const transformedResult = Actuals.actualsTransform(data.Items.map(item => ({
      key: AWS.DynamoDB.Converter.output(item.key),
      date: AWS.DynamoDB.Converter.output(item.date),
      hour: AWS.DynamoDB.Converter.output(item.hour),
      area: AWS.DynamoDB.Converter.output(item.area),
      rain: AWS.DynamoDB.Converter.output(item.rain)
    })));

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
  })();
}

// Forecasts Extract
if (process.env.SKIP_FORECASTS_EXTRACT == null) {
  (async () => {
    const result = await Forecasts.forecastsExtractHistory('2019-01-01 08:00');
    for (let i = 0; i < result.length; i += 25) {
      await ddb.batchWriteItem({
        RequestItems: {
          "forecasts-extract": result.slice(i, i + 25).map(r => 
            ({
              PutRequest: {
                Item: {
                  date: AWS.DynamoDB.Converter.input(r.date),
                  forecast: AWS.DynamoDB.Converter.input(r.forecast)
                }
              }
            })
          )
        }
      }).promise();
    }
  })();
}

// Forecasts Transform
if (process.env.SKIP_FORECASTS_TRANSFORM == null) {
  (async () => {
    const data = await ddb.scan({
      TableName: 'forecasts-extract',
    }).promise();

    const transformedResult = Forecasts.forecastsTransform(data.Items.map(item => ({
      date: AWS.DynamoDB.Converter.output(item.date),
      forecast: AWS.DynamoDB.Converter.output(item.forecast),
    })));

    for (let i = 0; i < transformedResult.length; i += 25) {
      await ddb.batchWriteItem({
        RequestItems: {
          "forecasts-transform": transformedResult.slice(i, i + 25).map(r => 
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
  })();
}