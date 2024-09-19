const express = require('express')
const router = express.Router()

// 載入 controller
const stockController = require('../../controllers/apis/stock-controller')

// 載入 middleware
const { apiErrorHandler } = require('../../middlewares/error-handler')

// 設計路由: 主要功能
router.get('/stocks', stockController.getStocks)
router.get('/stocks/:stockSymbol', stockController.getStock)
router.get('/stocks/:stockSymbol/download', stockController.downloadStock)
router.get('/stocks/watch/:payload', stockController.watchStockForEmail)
router.get('/stocks/unwatch/:payload', stockController.unwatchStockForEmail)
router.get('/stocks/list/:payload', stockController.listWatchesForEmail)
router.get('/stocks/toggle/:payload', stockController.toogleDaliyWatchForEmail)
router.get('/stocks/drop/:payload', stockController.dropEmail)

// 設計路由: 錯誤處理
router.use('/', (req, res) => res.redirect('/api/stocks'))
router.use('/', apiErrorHandler)

module.exports = router
