// 載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// 載入需要使用的工具
const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const { apis, pages } = require('./routes')
const cors = require('cors')
const scheduleKeepAliveReq  = require('./helpers/req-helpers')
const scheduleCronjob = require('./helpers/cronjob-helpers')

// 設定應用程式
const app = express()
const port = process.env.PORT || 3000

// 設計 middleware
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(cors()) // 應對瀏覽器 Cross-Origin Resource Sharing 政策

// 設計路由
app.use('/api', apis)
app.use('/', pages)

// 掛載執行處理程序
scheduleKeepAliveReq() // 定時發送請求以維持入站流量
scheduleCronjob() // 將指定的股票最新資訊發送給指定用戶

// 啟動並監聽網站
app.listen(port, () => {
  console.info(`The App is listening on: http://localhost:${port} `)
})
