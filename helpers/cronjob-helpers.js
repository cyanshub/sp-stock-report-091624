// 載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// 載入所需工具
const cron = require('node-cron')
const { getStockData, processStockData } = require('./stock-helpers')
const moment = require('moment-timezone')
const {
  sendDailyNewsEmail,
  sendDeathCrossAlert,
  sendGoldenCrossAlert,
  sendLowRSIAlert,
  sendRSIDropAlert
} = require('./email-helpers')

// 執行處理程序
const scheduleCronjob = () => {
  // 設定 cronjob: 每天凌晨 0 點（UTC+8）執行
  // 利用 cron 表達式設定任務執行時間, 用 5 個字段指定任務執行時間
  const cronExp = process.env.CRON_EXP

  // 調用 cronjob 函數: 提供最新股票資訊的信件通知服務
  // cron.schedule(執行時間, 觸發的 function, 設定時區)
  cron.schedule(
    cronExp,
    async () => {
      // 從環境變數拿取股票代號
      const stockSymbol = process.env.STOCK_SYMBOL || '0050'

      // 股票查詢的時間範圍(最新資料) P.S. 算指標還是需要足夠的時間
      const stockRange = process.env.STOCK_RANGE || '1y'

      // 得到股票資訊 EX: 日期、收盤價、成交量
      const { timestamps, closingPrices, volumes } = await getStockData(
        stockSymbol,
        stockRange
      )

      // 處理股票資訊, 用來計算指標 EX: 日期、收盤價、成交量
      const objArr = processStockData(
        stockSymbol,
        timestamps,
        closingPrices,
        volumes
      )

      // 拿到最新一筆資料
      const objArrLatest = objArr[objArr.length - 1]

      // 確保最新的資料存在
      if (!objArrLatest) {
        console.error('No latest stock data found')
        return
      }

      // 提取 stockInfo
      const stockInfo = { ...objArrLatest }

      // 拿到前一筆 RSI 數據
      const rsiPrevious = objArr[objArr.length - 2]?.rsi // 關於 RSI 大幅下降警報

      // 設定發送條件(確保環境變數正確轉換為數字型別)
      const rsiLow = Number(process.env.RSI_LOW) || 30 // RSI 低值預設為 30
      const rsiDrop = Number(process.env.RSI_DROP) || 10 // 關於 RSI 大幅下降警報

      // 確保 rsiCurrent 與 rsiPrevious 皆存在並且是數字
      if (
        typeof rsiPrevious !== 'number' ||
        typeof stockInfo.rsi !== 'number' // rsiCurrent
      ) {
        console.warn('No valid previous RSI data found')
      }

      // // 測試強制觸發通知條件
      // stockInfo.rsi = 24.9
      // stockInfo.crossType = 'golden-cross'
      // rsiPrevious = 50

      // 生成報告日期: 獲取 UTC+8 時區的當前日期，只顯示年、月、日
      const now = moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm')
      const reportTime = now

      // 建立 email 基本資訊
      const emailFrom = process.env.GMAIL_USER
      const emailTo = process.env.GMAIL_TO

      // email 傳送信件內容
      // 發送定期報告的 email
      await sendDailyNewsEmail(emailFrom, emailTo, stockInfo, reportTime)

      // 發送死亡交叉通知
      if (stockInfo.crossType === 'death-cross') {
        await sendDeathCrossAlert(
          emailFrom,
          emailTo,
          stockSymbol,
          stockInfo.timestamp,
          reportTime
        )
      }

      // 發送黃金交叉通知
      if (stockInfo.crossType === 'golden-cross') {
        await sendGoldenCrossAlert(
          emailFrom,
          emailTo,
          stockSymbol,
          stockInfo.timestamp,
          reportTime
        )
      }

      // 發送低 RSI 通知
      if (stockInfo.rsi < rsiLow) {
        await sendLowRSIAlert(
          emailFrom,
          emailTo,
          stockSymbol,
          stockInfo.timestamp,
          stockInfo.rsi,
          rsiLow,
          reportTime
        )
      }

      // 發送 RSI 大幅下降通知
      if (
        rsiPrevious &&
        stockInfo.rsi &&
        rsiPrevious - stockInfo.rsi > rsiDrop
      ) {
        await sendRSIDropAlert(
          emailFrom,
          emailTo,
          stockSymbol,
          stockInfo.timestamp,
          rsiPrevious,
          stockInfo.rsi,
          reportTime
        )
      }
    },
    {
      timezone: 'Asia/Taipei' // 設定時區為台北 (UTC+8)
    }
  )
}

// 輸出執行處理程序
module.exports = scheduleCronjob
