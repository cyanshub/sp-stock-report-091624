// 載入所需的工具
const {
  getStockData,
  processStockData,
  isStockSymbolValid
} = require('../helpers/stock-helpers')

const bcrypt = require('bcrypt') // 加密工具
const crypto = require('crypto') // Node.js 加密模組
const setupAllUserWatches = require('../helpers/schedule-watches-helpers') // 根據追蹤記錄動態設定通知排程

// 載入所需 model
const { Watch } = require('../models')

// 設計 stockServices
const stockServices = {
  getStocks: (req, cb) =>
    cb(null, {
      index: '首頁',
      view: {
        message: '請在網址列輸入你想查詢的股票代號, 例如: /api/stocks/0050',
        hint: '預設查詢範圍是從最近一個交易日起回溯 1 年'
      },

      download:
        '在股票代號後加上 download 就能下載對應的報表, 例如: /api/stocks/0050/download',

      messages: {
        message_1:
          '當使用以下追蹤服務時, 包括新增、更新、移除等功能, 系統會顯示提示訊息, 並寄發通知信件到指定的 email; 若未看到成功提示訊息, 代表操作未正確完成',

        message_2:
          '驗證碼是隨機生成的, 在建立股票追蹤時, 會自動寄發到指定的 email, 請妥善保存; 為確保資料安全, 有關查詢、更新、移除等操作都會需要你幫忙提供驗證碼',

        message_3:
          '若忘記驗證碼, 可利用當初登記的 email 寫信給管理員, 我們可以幫你取消所有股票的追蹤記錄'
      },

      list: '如果想檢查目前建立的所有追蹤記錄, 請在網址列輸入登記的 email + 驗證碼, 例如: /api/stocks/list/user1@example.com + 驗證碼',

      watch: {
        message_1:
          '如果想接收股票的事件通知, 可以輸入 email 和股票代號, 例如: /api/stocks/watch/user1@example.com + 0050',
        message_2:
          '預設關閉每日最新收盤價的通知; 如果想開起, 請在網址列最末尾加上 isDailyNewsTrue (大小寫皆可), 例如: /api/stocks/watch/user1@example.com + 0050 + + + isdailynewstrue ',

        hint: {
          watch_hint1:
            '請按範例格式填寫(順序為 email、股票代號、RSI警報值、通知時刻, 此順序不可變更), 否則系統將無法正確解讀資料',
          watch_hint2:
            'message 範例的意思是: 追蹤 0050, 並定期將該支股票的最新資訊及事件通知定期發送到填寫的 email',
          watch_hint3:
            '可設定 RSI 警報值及回報時刻, 若沒填寫則預設 RSI 警報值為 30, 預設事件通知時刻為晚間 21 時',
          watch_hint4:
            '若要設定 RSI 警報值(假設為27.5), 可以這樣寫, 例如: /api/stocks/watch/user1@example.com + 0050 + 27.5',
          watch_hint5:
            '若要設定通知時刻(假設為上午 8 時), 可以這樣寫, 例如: /api/stocks/watch/user1@example.com + 0050 + + 8',

          watch_hint6:
            '請填寫存在於股票市場的股票代號, 否則將回報:「Error: 無效的股票代號」',
          watch_hint7:
            '回報時間請填寫 server 的服務時間範圍內 (8 到 24 以內的正整數)',
          watch_hint8:
            'RSI 警報值不宜過高, 否則將頻繁觸發事件通知; 建議填寫 10 到 40 以內的數值 (接受小數點)'
        }
      },

      toggle: {
        message:
          '如果想接收或關閉股票的每日收盤價通知, 可以在網址列輸入 email 和股票代號, 並在末尾加上驗證碼, 例如: /api/stocks/toggle/user1@example.com + 0050 +  +  + 驗證碼',

        hint: {
          toggle_hint1: '切換通知開關時, 亦可以根據條件變更切換對象',
          toggle_hint2:
            '假設要切換 0050 中, RSI 警報為 25 的追蹤對象, 例如: /api/stocks/unwatch/user1@example.com + 0050 + 25 + + 驗證碼',
          toggle_hint3:
            '假設要切換 0050 中, 事件通知時刻為晚間 21 時的追蹤對象, 例如: /api/stocks/unwatch/user1@example.com + 0050 +  + 21 + 驗證碼',
          toggle_hint4:
            '在沒有特別指定條件, 或存在多筆不同 RSI 警報或事件通知時刻的記錄時, 優先從 id 較前的記錄進行切換'
        }
      },

      unwatch: {
        message:
          '如果想取消追蹤, 可以在網址列輸入 email 和股票代號, 並在末尾加上驗證碼, 例如: /api/stocks/unwatch/user1@example.com + 0050 + + + 驗證碼',
        hint: {
          unwatch_hint1: '取消追蹤時, 亦可以根據條件取消股票追蹤列表中的記錄',
          unwatch_hint2:
            '假設要取消 0050 中, RSI 警報為 30 的追蹤對象, 例如: /api/stocks/unwatch/user1@example.com + 0050 + 27 + + 驗證碼',
          unwatch_hint3:
            '假設要取消 0050 中, 事件通知時刻為晚間 21 時的追蹤對象, 例如: /api/stocks/unwatch/user1@example.com + 0050 +  + 21 + 驗證碼',
          unwatch_hint4:
            '在沒有指定特別條件的情況下, 或存在多筆不同 RSI 警報或事件通知時刻的記錄時, 優先從 id 較前的記錄移除'
        }
      },

      drop: '如果想取消所有追蹤服務, 只需在網址列輸入你登記的 email + 驗證碼, 我們會幫你取消所有的股票追蹤, 例如: /api/stocks/drop/user1@example.com + 驗證碼'
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
  watchStockForEmail: async (req, cb) => {
    // 提取路由變量所攜帶的參數
    const payload = req.params.payload
    let [email, stockSymbol, rsiLow, triggerHour, isDailyNewsTrue] =
      payload.split('+')

    // 移除首尾空白鍵
    email = email.trim()
    stockSymbol = stockSymbol.trim()
    rsiLow = rsiLow ? rsiLow.trim() : ''
    triggerHour = triggerHour ? triggerHour.trim() : ''
    isDailyNewsTrue = isDailyNewsTrue
      ? isDailyNewsTrue.trim().toLowerCase()
      : ''
    const isDailyNews = isDailyNewsTrue === 'isdailynewstrue' ? true : false

    // 如果 rsiLow 和 triggerHour 沒有提供, 則使用預設值
    rsiLow = rsiLow.length > 0 ? Number(rsiLow) : 30 // 預設 rsiLow 為 30
    triggerHour = triggerHour.length > 0 ? Number(triggerHour) : 21 // 預設 triggerHour 為 21

    try {
      // 檢查股票代號是否有效
      const isValid = await isStockSymbolValid(stockSymbol)
      if (!isValid) {
        const error = new Error('無效的股票代號')
        error.status = 404 // 股票代號不存在
        return cb(error)
      }

      // 檢查 RSI 值是否合理 (0 到 100 之間)
      if (isNaN(rsiLow) || rsiLow < 10 || rsiLow > 40) {
        const error = new Error('無效的 RSI 值, 應介於 10 到 40 之間')
        error.status = 422 // 無法處理的實體
        return cb(error)
      }

      // 檢查觸發時刻是否在伺服器服務時間內 (8 到 24 之內的正整數)
      if (
        isNaN(triggerHour) ||
        triggerHour < 8 ||
        triggerHour > 24 ||
        !Number.isInteger(triggerHour)
      ) {
        const error = new Error(
          '無效的觸發時刻, 事件通知時刻應填寫 8 到 24 以內的正整數'
        )
        error.status = 422 // 無法處理的實體
        return cb(error)
      }

      // 資料處理
      if (triggerHour === 24) {
        triggerHour = 0 // 將 24 點轉換為 0 點, 以符合 cronjob 的規則
      }

      triggerHour = triggerHour.toString()

      // 檢查是否已經存在相同的 email + stockSymbol + rsiLow 組合
      const existingWatch = await Watch.findOne({
        where: { email, stockSymbol, rsiLow, triggerHour }
      })
      if (existingWatch) {
        const error = new Error('已經存在相同的追蹤記錄')
        error.status = 409 // 資料衝突
        return cb(error)
      }

      // 生成驗證碼: 先檢查資料庫是否有相同的 email
      const existingEmail = await Watch.findOne({
        where: { email }
      })

      // 如果該 email 已經存在則重用其驗證碼, 給予提示及不顯示明碼; 如果不存在則生成隨機六位數驗證碼, 並回傳明碼
      const verificationCode = existingEmail
        ? null
        : crypto.randomInt(100000, 999999).toString()

      const hashVerificationCode = existingEmail
        ? existingEmail.verificationCode
        : await bcrypt.hash(verificationCode, 10)

      // 操作資料庫新增資料
      const newWatch = await Watch.create({
        email,
        stockSymbol,
        rsiLow,
        triggerHour,
        isDailyNews,
        verificationCode: hashVerificationCode // 儲存加密驗證碼
      })

      // 將原始驗證碼存回要傳遞出去的 data
      // 如果生成新驗證碼則傳回明碼; 否則提示驗證碼與先前相同
      const data = {
        ...newWatch.toJSON(), // 展開新創建的 watch 資料
        verificationCode: verificationCode
          ? verificationCode
          : '驗證碼與先前 email 收到的驗證碼相同' // 將明碼的驗證碼包裝進結果
      }

      // 異動追蹤記錄時, 動態觸發設定通知排程
      setupAllUserWatches()

      return cb(null, data)
    } catch (error) {
      error.messages = '新增追蹤股票失敗'
      error.status = 500
      return cb(error)
    }
  },
  unwatchStockForEmail: async (req, cb) => {
    // 提取路由變量所攜帶的參數
    const payload = req.params.payload
    let [email, stockSymbol, rsiLow, triggerHour, verificationCode] =
      payload.split('+')

    // 移除首尾空白鍵
    email = email.trim()
    stockSymbol = stockSymbol.trim()
    verificationCode = verificationCode ? verificationCode.trim() : null // 檢查驗證碼

    // 判斷是否提供 rsiLow 和 triggerHour，空字串應該視為無效值
    rsiLow = rsiLow && rsiLow.trim() !== '' ? Number(rsiLow.trim()) : null // 確保資料型別正確; 若無提供則保持為 null
    triggerHour =
      triggerHour && triggerHour.trim() !== '' ? triggerHour.trim() : null // 保持 triggerHour 為字串, 若無提供則保持為 null

    try {
      // 構建 where 條件, 根據提供的參數進行刪除條件的篩選
      const whereClause = { email, stockSymbol }

      // 根據是否提供 rsiLow 和 triggerHour 來進行條件補充
      if (rsiLow !== null) whereClause.rsiLow = rsiLow
      if (triggerHour !== null) whereClause.triggerHour = triggerHour

      // 檢查追蹤組合是否存在於資料庫中
      const deletedWatch = await Watch.findOne({
        where: whereClause
      })

      if (!deletedWatch) {
        const error =
          rsiLow || triggerHour
            ? new Error(
                `填寫的 email 尚未追蹤過指定的股票代號, 或未正確填寫 RSI 值或觸發時刻`
              )
            : new Error('填寫的 email 尚未追蹤過指定的股票代號')

        error.status = 404 // 資料未找到
        return cb(error)
      }

      // 檢查驗證碼
      const isMatch = await bcrypt.compare(
        verificationCode,
        deletedWatch.verificationCode
      )

      if (!isMatch) {
        const error = new Error(`您所輸入的驗證碼錯誤, 請重新輸入驗證碼`)
        error.status = 403 // 沒有權限
        return cb(error)
      }

      // 操作資料庫移除資料
      await deletedWatch.destroy() // 使用 Sequelize 的 destroy 方法

      // 切換顯示成所輸入的明碼後回傳
      deletedWatch.verificationCode = verificationCode
      const data = deletedWatch

      // 異動追蹤記錄時, 動態觸發設定通知排程
      setupAllUserWatches()

      return cb(null, data)
    } catch (error) {
      error.messages = '取消追蹤股票失敗'
      error.status = 500
      return cb(error)
    }
  },

  listWatchesForEmail: async (req, cb) => {
    // 提取路由變量所攜帶的參數, 並移除首尾空白鍵
    const payload = req.params.payload
    let [email, verificationCode] = payload.split('+')

    // 移除首尾空白鍵
    email = email.trim()
    verificationCode = verificationCode ? verificationCode.trim() : null // 檢查驗證碼

    try {
      // 構建 where 條件, 根據提供的參數進行刪除條件的篩選
      const whereClause = { email }

      // 操作資料庫, 找出所有含有 email 的記錄
      const watches = await Watch.findAll({
        where: whereClause,
        raw: true
      })

      // 檢查資料庫是否至少有輸入 email 追蹤的股票
      if (watches.length === 0) {
        const error = new Error('輸入的 email 並未找到追蹤股票的記錄')
        error.status = 404
        return cb(error)
      }

      // 檢查驗證碼(取查詢的任一筆資料)
      const isMatch = await bcrypt.compare(
        verificationCode,
        watches[0].verificationCode
      )

      if (!isMatch) {
        const error = new Error(`您所輸入的驗證碼錯誤, 請重新輸入驗證碼`)
        error.status = 403 // 沒有權限
        return cb(error)
      }

      // 將暗碼改成所輸入的明碼
      const queryWatches = watches.map((watch) => {
        return {
          ...watch,
          verificationCode // 將驗證碼換成使用者輸入的明碼
        }
      })

      // 回傳資料
      const data = queryWatches
      return cb(null, data)
    } catch (error) {
      error.messages = '暫時無法查詢指定 email 之追蹤股票記錄'
      error.status = 500
      return cb(error)
    }
  },

  toogleDaliyWatchForEmail: async (req, cb) => {
    // 提取路由變量所攜帶的參數
    const payload = req.params.payload
    let [email, stockSymbol, rsiLow, triggerHour, verificationCode] =
      payload.split('+')

    // 移除首尾空白鍵
    email = email.trim()
    stockSymbol = stockSymbol.trim()
    verificationCode = verificationCode ? verificationCode.trim() : null // 檢查驗證碼

    // 判斷是否提供 rsiLow 和 triggerHour，空字串應該視為無效值
    rsiLow = rsiLow && rsiLow.trim() !== '' ? Number(rsiLow.trim()) : null // 確保資料型別正確; 若無提供則保持為 null
    triggerHour =
      triggerHour && triggerHour.trim() !== '' ? triggerHour.trim() : null // 保持 triggerHour 為字串, 若無提供則保持為 null

    try {
      // 構建 where 條件, 根據提供的參數進行查找
      const whereClause = { email, stockSymbol }

      // 根據是否提供 rsiLow 和 triggerHour 來進行條件補充
      if (rsiLow !== null) whereClause.rsiLow = rsiLow
      if (triggerHour !== null) whereClause.triggerHour = triggerHour

      // 查找現有的 watch 記錄
      const watch = await Watch.findOne({ where: whereClause })

      if (!watch) {
        const error =
          rsiLow || triggerHour
            ? new Error(
                `填寫的 email 尚未追蹤過指定的股票代號, 或未正確填寫 RSI 值或觸發時刻`
              )
            : new Error('填寫的 email 尚未追蹤過指定的股票代號')

        error.status = 404 // 資料未找到
        return cb(error)
      }

      // 檢查驗證碼
      const isMatch = await bcrypt.compare(
        verificationCode,
        watch.verificationCode
      )

      if (!isMatch) {
        const error = new Error(`您所輸入的驗證碼錯誤, 請重新輸入驗證碼`)
        error.status = 403 // 沒有權限
        return cb(error)
      }

      // 操作資料庫更新資料(切換 Daliy News 接收狀態)
      watch.isDailyNews = !watch.isDailyNews
      await watch.save()

      // 切換顯示成所輸入的明碼後回傳
      const watchQuery = watch
      watchQuery.verificationCode = verificationCode
      const data = watchQuery

      // 異動追蹤記錄時, 動態觸發設定通知排程
      setupAllUserWatches()

      return cb(null, data)
    } catch (error) {
      error.messages = '暫時無法更新每日監控狀態'
      error.status = 500
      return cb(error)
    }
  },

  dropEmail: async (req, cb) => {
    // 提取路由變量所攜帶的參數, 並移除首尾空白鍵
    const payload = req.params.payload
    let [email, verificationCode] = payload.split('+')

    // 移除首尾空白鍵
    email = email.trim()
    verificationCode = verificationCode ? verificationCode.trim() : null // 檢查驗證碼

    try {
      // 構建 where 條件, 根據提供的參數進行刪除條件的篩選
      const whereClause = { email }

      // 操作資料庫, 找出所有含有 email 的記錄
      const watches = await Watch.findAll({
        where: whereClause
      })

      // 檢查資料庫是否至少有輸入 email 追蹤的股票
      if (watches.length === 0) {
        const error = new Error('輸入的 email 並未找到追蹤股票的記錄')
        error.status = 404
        return cb(error)
      }

      // 檢查驗證碼(取查詢的任一筆資料)
      const isMatch = await bcrypt.compare(
        verificationCode,
        watches[0].verificationCode
      )

      if (!isMatch) {
        const error = new Error(`您所輸入的驗證碼錯誤, 請重新輸入驗證碼`)
        error.status = 403 // 沒有權限
        return cb(error)
      }

      // 使用 Promise.all 確保所有異步刪除操作都完成
      await Promise.all(watches.map((watch) => watch.destroy()))

      // 將暗碼改成所輸入的明碼回傳
      const deletedWatches = watches.map((watch) => {
        return {
          ...watch.toJSON(),
          verificationCode // 將驗證碼換成使用者輸入的明碼
        }
      })

      const data = deletedWatches // 返回刪除結果資訊

      // 異動追蹤記錄時, 動態觸發設定通知排程
      setupAllUserWatches()

      return cb(null, data)
    } catch (error) {
      error.message = '取消追蹤股票失敗'
      error.status = 500
      return cb(error)
    }
  }
}

module.exports = stockServices
