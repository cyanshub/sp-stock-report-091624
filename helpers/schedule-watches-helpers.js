// 載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// 載入所需工具
const scheduleCronjob = require('./cronjob-helpers')

// 載入 Model
const { Watch } = require('../models') // 載入 Watch 模型

// 記得在新增路由, 設定當有使用者新增追蹤記錄時, 觸發執行

// 啟動應用時立即執行一次
// 查詢所有 watches 資料, 並根據每筆資料執行 cronjob
const setupAllUserWatches = async () => {
  try {
    // 從資料庫中查詢所有記錄
    const watches = await Watch.findAll({ raw: true })

    // 遍歷每個 watch 記錄
    watches.map((watch) => {
      const {
        email, // 使用者的 email
        stockSymbol, // 使用者追蹤的股票代號
        rsiLow, // 低 RSI 閥值
        triggerHour, // 發送通知的時間 (小時)
        isDailyNews // 決定是否寄發每日收盤價
      } = watch // 提取出這些屬性

      // 提示本次發送通知的對象
      console.log(
        `通知 email: ${email}、股票代號: ${stockSymbol}、RSI 警報值: ${rsiLow}、通知時刻: ${triggerHour}時`
      )

      // 調用 scheduleCronjob, 為每個 watch 設定 cronjob, 並執行處理程序
      scheduleCronjob({
        email,
        stockSymbol,
        lowRSI: rsiLow,
        triggerHour,
        isDailyNews
      })
    })
  } catch (error) {
    console.error('Error setting up user watches:', error)
  }
}

module.exports = setupAllUserWatches
