const axios = require('axios')
const moment = require('moment')
const cheerio = require('cheerio')

/**
 * Extract actuals information from HKO
 *
 * @param {string[]} months Months to be scaped in "YYYYMM" format. E.g ['201901', '201902']
 * @return {{month: string, dayData: string[][]}[]} The scaped data
 */
async function actualsExtract(start) {
  let result = [];
  let date = moment(start, 'YYYY-MM-DD')
  let today = moment();

  while (date.isBefore(today)) {
    for (let hour = 0; hour <= 23; hour++) {
      console.log(`https://www.hko.gov.hk/wxinfo/rainfall/rf_record_uc.shtml?form=rfrecordc&Selmonth=${date.format('MM')}&Selday=${date.format('DD')}&Selhour=${hour}`)
      const res = await axios.get(`https://www.hko.gov.hk/wxinfo/rainfall/rf_record_uc.shtml?form=rfrecordc&Selmonth=${date.format('MM')}&Selday=${date.format('DD')}&Selhour=${hour}`)
      const $ = cheerio.load(res.data);
      
      const rainfalls = Array.from($('table[title=各區錄得雨量列表] tr'));
      rainfalls.shift();
      
      for (const tr of rainfalls) {
        result.push({
          key: date.format('YYYY-MM-DD') + '-' + hour + '-' + $('td', tr).first().text(),
          date: date.format('YYYY-MM-DD'),
          hour,
          area: $('td', tr).first().text(),
          rain: $('td', tr).last().text()
        });
      }
    }
    date = date.add(1, 'day')
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

  let recordsByDate = {};
  let records = results.slice();
  
  records = records.map(r => ({...r, area: r.area.replace(/ /g, '')}))
  records = records.filter(r => r.rain.match(/(\d+) 毫/) != null)
  records = records.map(r => ({...r, rainLower: parseInt(r.rain.match(/^(\d+)/)[1])}))
  records = records.map(r => ({...r, rainUpper: parseInt(r.rain.match(/(\d+) 毫/)[1])}))

  for (const record of records) {
    if (recordsByDate[record.date] == null) {
      recordsByDate[record.date] = 0;
    }
    if (isNaN(record.rainLower)) {
      record.rainLower = 0;
    }
    if (isNaN(record.rainUpper)) {
      record.rainUpper = 0;
    }
    recordsByDate[record.date] = Math.max(recordsByDate[record.date], (record.rainLower + record.rainUpper)/2);
  }

  for (const date in recordsByDate) {
    transformResults.push({
      date: date,
      rain: recordsByDate[date],
    })
  }

  return transformResults;
}

module.exports = {
  actualsExtract,
  actualsTransform
}
