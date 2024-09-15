// 載入 services 層
const stockServices = require('../../services/stock-services')

// 設計 stockController
const stockController = {
  getStocks: (req, res, next) => {
    return stockServices.getStocks(req, (err, data) => (err ? next(err) : res.json({ status: 200, data })))
  },
  getStock: (req, res, next) => {
    return stockServices.getStock(req, (err, data) => (err ? next(err) : res.json({ status: 200, data })))
  }
}

module.exports = stockController
