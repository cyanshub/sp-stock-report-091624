// 載入 services 層
const stockServices = require('../../services/stock-services')

// 載入所需工具
const { writeRowsCSVFile } = require('../../helpers/csv-helpers')
const path = require('path')
const fs = require('fs')

// 設計 stockController
const stockController = {
  getStocks: (req, res, next) => {
    return stockServices.getStocks(req, (err, data) =>
      err ? next(err) : res.json({ status: 200, data })
    )
  },
  getStock: (req, res, next) => {
    return stockServices.getStock(req, (err, data) =>
      err ? next(err) : res.json({ status: 200, data })
    )
  },
  downloadStock: (req, res, next) => {
    return stockServices
      .downloadStock(req, (err, data) => {
        if (err) next(err)
        // 得到物件陣列
        const objArr = data

        // 定義 CSV 文件的路徑
        const outputDirectory = path.join(__dirname, '../../downloads')
        const outputFilePath = path.join(outputDirectory, 'output.csv')

        // 檢查目錄是否存在，不存在則創建之
        if (!fs.existsSync(outputDirectory)) {
          fs.mkdirSync(outputDirectory, { recursive: true })
        }

        // 將物件陣列寫入 CSV 文件 (非同步語法必須接 .then 確保此功能在下一步前執行完)
        return writeRowsCSVFile(objArr, outputFilePath).then(
          () => outputFilePath
        )
      })
      .then((outputFilePath) => {
        // 使用 Express 的 res.download 方法讓使用者下載文件
        res.download(outputFilePath, `stock-data.csv`, (unDownloadErr) => {
          if (unDownloadErr) {
            const error = new Error(
              `Error during file download: ${unDownloadErr}`
            )
            error.status = 500
            throw error
          }
          console.log('CSV file downloaded successfully')
          console.log('CSV file deleted successfully after downloading')

          // 當文件下載成功後, 可以刪除臨時文件(避免文件累積過多)
          fs.unlink(outputFilePath, (unlinkErr) => {
            if (unlinkErr) {
              const error = new Error(`Error deleting file: ${unlinkErr}`)
              error.status = 500
              throw error
            }
          })
        })
      })
      .catch((err) => next(err)) // 使用 catch 處理異常
  }
}

module.exports = stockController
