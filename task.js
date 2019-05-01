const Forecast = require('./forecasts')
const fs = require('fs')

(async function() {
  const forecast = new Forecast();
  const results = await forecast.extract('2019-01-01 08:00');
  
  await fs.promises.writeFile('forecasts-extract.json', JSON.stringify(results));
})();

(async function() {
  const forecast = new Forecast();
  const results = JSON.parse(await fs.promises.readFile('forecasts-extract.json', 'utf8'));

  const transformedResults = await forecast.transform(results);
  await fs.promises.writeFile('forecasts-transform.json', JSON.stringify(transformedResults));
})();