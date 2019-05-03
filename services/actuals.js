const axios = require('axios')
const fs = require('fs')
const moment = require('moment')

/**
 * Extract actuals information from HKO
 *
 * @param {string[]} months Months to be scaped in "YYYYMM" format. E.g ['201901', '201902']
 * @return {{month: string, dayData: string[][]}[]} The scaped data
 */
async function actualsExtract(months) {
  let result = [];

  for (const month of months) {
    const res = await axios.get(`https://www.weather.gov.hk/cis/dailyExtract/dailyExtract_${month}.xml`);
  
    result.push({
      month: month,
      dayData: res.data.stn.data[0].dayData
    });
  }

  return result;
  // await fs.promises.writeFile('actuals-extract.json', JSON.stringify(result));
}

/**
 * Transform actuals information from the HKO extracts
 *
 * @param {{month: string, dayData: string[][]}[]} results The extracted data
 * @return {{date: string, rain: number}[]} The transformed data
 */
function actualsTransform(results) {
  // const results = JSON.parse(await fs.promises.readFile('actuals-extract.json', 'utf8'));
  const transformResults = [];

  for (const result of results) {
    for (const day of result.dayData) {
      if (day[0] === 'Mean/Total' || day[0] === 'Normal') {
        continue;
      }
      transformResults.push({
        date: moment(result.month + day[0], 'YYYYMMDD').format('YYYY-MM-DD'),
        rain: day[8] === 'Trace' ? 0 : parseFloat(day[8])
      });
    }
  }

  return transformResults;
  // await fs.promises.writeFile('actuals-transform.json', JSON.stringify(transformResults));
}

module.exports = {
  actualsExtract,
  actualsTransform
}

// extractActuals();
// extractTransform();