// 載入所需的工具
const { getStockData, processStockData } = require('../helpers/stock-helpers')

// 載入所需 model
const { Watch } = require('../models')

// 設計 stockServices
const stockServices = {
  getStocks: (req, cb) =>
    cb(null, {
      index: '首頁',
      view: '請在網址列輸入你想查詢的股票代號, 例如: /api/stocks/0050',
      hint: '預設查詢範圍是從今天起回溯 1 年',
      download:
        '在股票代號後加上 download 就能下載對應的報表, 例如: /api/stocks/0050/download'
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
        objArr.sort((a, b) => b.id - a.id)

        return cb(null, objArr)
      })
      .catch((err) => cb(err))
  },
  downloadStock: (req, cb) => {
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
      .then((objArr) => cb(null, objArr))
      .catch((err) => cb(err))
  },
  watchStockForEmail: (req, cb) => cb(null, { messages: '功能開發中' }),
  unwatchStockForEmail: (req, cb) => cb(null, { messages: '功能開發中' }),
  listWatchesForEmail: (req, cb) => cb(null, { messages: '功能開發中' }),
  toggleDaliyWatchForEmail: (req, cb) => cb(null, { messages: '功能開發中' }),
  dropEmail: (req, cb) => cb(null, { messages: '功能開發中' })
}

module.exports = stockServices
