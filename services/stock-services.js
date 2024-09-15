// 載入所需 model

// 設計 stockServices
const stockServices = {
  getStocks: (req, cb) => cb(null, { messages: '首頁' }),
  getStock: (req, cb) => cb(null, { messages: '功能開發中' })
}

module.exports = stockServices
