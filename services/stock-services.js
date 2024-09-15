// 載入所需的工具
const { getStockData, processStockData } = require('../helpers/stock-helpers')

// 載入所需 model

// 設計 stockServices
const stockServices = {
  getStocks: (req, cb) =>
    cb(null, {
      messages: '首頁',
      hint: '請在網址列輸入欲查詢的股票代號 例: /api/stocks/0050'
    }),
  getStock: (req, cb) => {
    // 從動態路由拿取股票代號
    const stockSymbol = req.params.stockSymbol

    // 股票查詢的時間
    let stockRange
    stockRange = stockRange ? stockRange : process.env.STOCK_RANGE

    // 得到股票資訊 EX: 日期、收盤價、成交量
    return getStockData(stockSymbol, stockRange)
      .then(({ timestamps, closingPrices, volumes }) => {
        // 處理股票資訊, 用來計算指標 EX: 日期、收盤價、成交量
        return processStockData(stockSymbol, timestamps, closingPrices, volumes)
      })
      .then((objArr) => {
        // 優先顯示近期資料: 根據 id 進行降冪排序
        objArr.sort((a,b) => b.id - a.id)

        return cb(null, objArr)
      })
      .catch((err) => cb(err))
  }
}

module.exports = stockServices
