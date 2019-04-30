const axios = require('axios');
const moment = require('moment');
const xpath = require('xpath');
const DOMParser = require('xmldom').DOMParser;
const fs = require('fs');

async function forecastsExtract() {
  let current = moment('2019-01-01 08:00', 'YYYY-MM-DD HH:mm')
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

  await fs.promises.writeFile('forecasts-extract.json', JSON.stringify(result));
}

forecastsExtract();