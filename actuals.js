const axios = require('axios')
const fs = require('fs')
const moment = require('moment')

async function extractActuals() {
  const months = [
    '201901',
    '201902',
    '201903',
    '201904',
  ]
  let result = [];

  for (const month of months) {
    const res = await axios.get(`https://www.weather.gov.hk/cis/dailyExtract/dailyExtract_${month}.xml`);
  
    result.push({
      month: month,
      dayData: res.data.stn.data[0].dayData
    });
  }

  await fs.promises.writeFile('actuals-extract.json', JSON.stringify(result));
}

async function extractTransform() {
  const results = JSON.parse(await fs.promises.readFile('actuals-extract.json', 'utf8'));
  const transformResults = [];

  for (const result of results) {
    for (const day of result.dayData) {
      transformResults.push({
        date: moment(result.month + day[0], 'YYYYMMDD').format('YYYY-MM-DD'),
        rain: day[8] === 'Trace' ? 0 : parseFloat(day[8])
      });
    }
  }

  await fs.promises.writeFile('actuals-transform.json', JSON.stringify(transformResults));
}

// extractActuals();
extractTransform();