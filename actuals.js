const axios = require('axios')
const fs = require('fs')

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

extractActuals();