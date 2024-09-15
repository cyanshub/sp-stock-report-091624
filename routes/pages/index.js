const express = require('express')
const router = express.Router()

// 載入 controller
const stockController = require('../../controllers/pages/stock-controller')

// 載入 middleware
const { generalErrorHandler } = require('../../middlewares/error-handler')

// 設計路由: 主要功能
router.get('/stocks', stockController.getStocks)
router.get('/stocks/:stockSymbol', stockController.getStock)

// 設計路由: 錯誤處理 (暫時都先導向 api 頁面)
router.use('/', (req, res) => res.redirect('/api/stocks'))
router.use('/', generalErrorHandler)

module.exports = router
