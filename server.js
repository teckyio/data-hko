const express = require('express')
const app = express()

app.use(express.static(__dirname + '/public'))

app.get('/actuals-transform.json', (req, res) => {
  res.sendFile(__dirname + '/actuals-transform.json')
})

app.get('/forecasts-transform.json', (req, res) => {
  res.sendFile(__dirname + '/forecasts-transform.json')
})

app.listen(3000) // localhost:3000