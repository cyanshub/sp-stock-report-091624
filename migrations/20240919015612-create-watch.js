'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('watches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING
      },
      stock_symbol: {
        allowNull: false,
        type: Sequelize.STRING
      },
      rsi_low: {
        allowNull: true,
        type: Sequelize.FLOAT
      },
      trigger_hour: {
        allowNull: true,
        type: Sequelize.STRING
      },
      is_daily_news: {
        allowNull: true,
        type: Sequelize.BOOLEAN
      },
      verification_code: {
        allowNull: true,
        type: Sequelize.STRING
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('watches')
  }
}
