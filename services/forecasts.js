const axios = require('axios');
const moment = require('moment');
const xpath = require('xpath');
const DOMParser = require('xmldom').DOMParser;
const fs = require('fs');

/**
 * Extract historical forecasts information from data.gov.hk
 *
 * @param {string} start Start date to be scaped in "YYYY-MM-DD HH:mm" format. E.g ['2019-01-01 08:00']
 * @return {{date: string, forecast: string}[]} The scaped data
 */
async function forecastsExtractHistory(start) {
  let current = moment(start, 'YYYY-MM-DD HH:mm')
  let today = moment()
  let result = []

  while (current.isBefore(today)) {
    let hours = ['0800', '0830', '0801', '0747', '0751'];
    let res = null;

    while (hours.length > 0) {
      const url = `https://s3-ap-southeast-1.amazonaws.com/historical-resource-archive/2019/${current.format('MM')}/${current.format('DD')}/http%253A%252F%252Frss.weather.gov.hk%252Frss%252FLocalWeatherForecast_uc.xml/${hours.shift()}`;
      console.log(url);
      try {
        res = await axios.get(url)
        break;
      } catch (e) {

      }
    }

    if (res == null) {
      throw new Error('No such forecast');
    }

    const doc = new DOMParser().parseFromString(res.data);
    const forecast = xpath.select('*//item/description', doc);

    result.push({
      date: current.format('YYYY-MM-DD'),
      forecast: forecast[0].firstChild.data
    });

    current = current.add(1, 'day');
  }

  return result;
  // await fs.promises.writeFile('forecasts-extract.json', JSON.stringify(result));
}

/**
 * Extract current forecasts information directly from HKO
 *
 * @param {string} start Start date to be scaped in "YYYY-MM-DD HH:mm" format. E.g ['2019-01-01 08:00']
 * @return {{date: string, forecast: string}} The scaped data
 */
async function forecastsExtractCurrent() {
  const url = `https://rss.weather.gov.hk/rss/LocalWeatherForecast_uc.xml`;
  const res = await axios.get(url)
    
  const doc = new DOMParser().parseFromString(res.data);
  const forecast = xpath.select('*//item/description', doc);

  return {
    date: moment().format('YYYY-MM-DD'),
    forecast: forecast[0].firstChild.data
  }
}

/**
 * Transform forecasts information from the HKO/Data.gov.hk extracts
 *
 * @param {{date: string, forecast: string}[]} results The extracted data
 * @return {{date: string, forecast: string | null}[]} The transformed data
 */
function forecastsTransform(results) {
  // const results = JSON.parse(await fs.promises.readFile('forecasts-extract.json', 'utf8'));
  const transformedResults = []

  for (const result of results) {
    let match = result.forecast.match(/本港地區今日天氣預測:<br\/>(.*?)<br\/>/);
    let rain = match[1].match(/狂風雷暴/)
    if (rain != null) {
      rain = '狂風雷暴';
    } else {
      rain = match[1].match(/有[^有雨]*?雨/)
      if (rain != null) {
        rain = rain[0].replace(/(一兩陣|幾陣|薄霧及)/g, '')
      }
    }

    transformedResults.push({
      date: result.date,
      rain: rain
    })
  }

  return transformedResults;
  // await fs.promises.writeFile('forecasts-transform.json', JSON.stringify(transformedResults))
}

module.exports = {
  forecastsExtractHistory,
  forecastsExtractCurrent,
  forecastsTransform
}
// forecastsExtract();
// forecastsTransform();