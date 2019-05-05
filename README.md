# 天文台理想與現實

香港天文台的預測經常令你失望？是你的心理作用，還是這台的預測真的有偏差？這個 d3.js Visualisation 連 Web Scraping 的示範讓你一眼看通事實！

![預覽圖](https://raw.githubusercontent.com/teckyio/data-hko/master/201901-04.png)

## REQUIREMENTS

你需要以下軟件來運行 Visualisation 和 Web Scraping 部份

- Node.js (版本 10 或以上)

## INSTALLATION

1. 把這專案 clone 下來

2. 在這專案中執行 `npm install`

3. 如需 scraping，可修改 `forecasts.js` 或 `actuals.js`，然後在這專案中執行 `node forecasts` 或 `node actuals`

4. 如需顯示 d3.js 的圖表，可在這專案中執行 `node server`

## TODO

- [x] 無需要修改源碼，便可更容易作 scraping 
- [x] CI/CD
- [x] Frontend 自訂「實際有雨」的定義
- [ ] 於每小時雨量報告，以地區作篩選
- [ ] 只計算八點後的降雨量
- [ ] 抓取九天天氣預報
- [ ] 視頻教學

## LICENSE

This work is licensed under the Creative Commons Attribution 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.