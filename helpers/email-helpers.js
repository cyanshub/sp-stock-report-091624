// email-helpers.js
// 集中管理信件發送邏輯

// 載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// 載入所需工具
const nodemailer = require('nodemailer')

// 建立一個 email 傳送器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

// 通用的發送 email 函數
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.response)
  } catch (err) {
    console.error('Error sending email:', err)
  }
}

// 發送定期報告的 email
const sendDailyNewsEmail = async (
  emailFrom,
  emailTo,
  stockInfo,
  reportTime
) => {
  const {
    stockSymbol,
    timestamp,
    closingPrice,
    sma10,
    sma50,
    rsi,
    volume,
    interpolatedPrice,
    interpolatedVolume,
    isSma10Strong,
    crossType
  } = stockInfo

  const emailSubject = `Stock Report for ${stockSymbol}`
  const emailText = `
    ${stockSymbol} 最新市場資訊:
    交易日: ${timestamp}
    
    收盤價(原始值): ${formatNumber(closingPrice)}
    十日平均線(SMA10): ${formatNumber(sma10) || 'N/A'}
    五十日平均線(SMA50): ${formatNumber(sma50) || 'N/A'}
    相對強弱指標 RSI: ${formatNumber(rsi) + '%' || 'N/A'}
    黃金交叉或死亡交叉: ${crossType || 'None'}
    
    十日平均線是否處於強勢狀態: ${isSma10Strong}
    成交量(原始值): ${volume || 'N/A'} [張]
    
    收盤價(插值): ${formatNumber(interpolatedPrice)}
    成交量(插值): ${interpolatedVolume || 'N/A'} [張]
    
    Date: ${reportTime}
    
    Best regards,
    Your Stock Monitoring System
  `

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: emailSubject,
    text: emailText
  }

  await sendEmail(mailOptions)
}

// 發送死亡交叉通知
const sendDeathCrossAlert = async (
  emailFrom,
  emailTo,
  stockSymbol,
  timestamp,
  reportTime
) => {
  const emailSubject = `Alert: Death Cross for ${stockSymbol}`
  const emailText = `
    Alert: ${stockSymbol}的移動平均線已發生死亡交叉:
    交易日: ${timestamp}
    Date: ${reportTime}

    Best regards,
    Your Stock Monitoring System
  `

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: emailSubject,
    text: emailText
  }

  await sendEmail(mailOptions)
}

// 發送黃金交叉通知
const sendGoldenCrossAlert = async (
  emailFrom,
  emailTo,
  stockSymbol,
  timestamp,
  reportTime
) => {
  const emailSubject = `Alert: Golden Cross for ${stockSymbol}`
  const emailText = `
    Alert: ${stockSymbol}的移動平均線已發生黃金交叉:
    交易日: ${timestamp}
    Date: ${reportTime}

    Best regards,
    Your Stock Monitoring System
  `

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: emailSubject,
    text: emailText
  }

  await sendEmail(mailOptions)
}

// 發送低 RSI 通知
const sendLowRSIAlert = async (
  emailFrom,
  emailTo,
  stockSymbol,
  timestamp,
  rsi,
  rsiLow,
  reportTime
) => {
  const emailSubject = `Alert: Low RSI for ${stockSymbol}`
  const emailText = `
    Alert: ${stockSymbol} 的 RSI 已衰退至 ${rsiLow}% 以下:
    RSI: ${formatNumber(rsi) + '%' || 'N/A'}
    交易日: ${timestamp}
    Date: ${reportTime}

    Best regards,
    Your Stock Monitoring System
  `

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: emailSubject,
    text: emailText
  }

  await sendEmail(mailOptions)
}

// 發送 RSI 大幅下降通知
const sendRSIDropAlert = async (
  emailFrom,
  emailTo,
  stockSymbol,
  timestamp,
  rsiPrevious,
  rsiLatest,
  reportTime
) => {
  const emailSubject = `Alert: Significant RSI Drop for ${stockSymbol}`
  const emailText = `
    Alert: ${stockSymbol} 的 RSI 相較於前日大幅衰退超過 10%:
    RSI 前一個交易日: ${formatNumber(rsiPrevious) + '%' || 'N/A'}
    RSI 最近一個交易日: ${formatNumber(rsiLatest) + '%' || 'N/A'}
    交易日: ${timestamp}
    Date: ${reportTime}

    Best regards,
    Your Stock Monitoring System
  `

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: emailSubject,
    text: emailText
  }

  await sendEmail(mailOptions)
}

// 將數值轉乘千分位字串顯示(預設取到小數點第二位)
const formatNumber = (number, decimalPlaces = 2) => {
  const roundedNumber = Number(number.toFixed(decimalPlaces)) // 四捨五入到指定小數點位數
  return roundedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

module.exports = {
  sendDailyNewsEmail,
  sendDeathCrossAlert,
  sendGoldenCrossAlert,
  sendLowRSIAlert,
  sendRSIDropAlert
}
