'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Watch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Watch.init(
    {
      email: DataTypes.STRING,
      stockSymbol: DataTypes.STRING,
      rsiLow: DataTypes.FLOAT,
      triggerHour: DataTypes.STRING,
      isDailyNews: DataTypes.BOOLEAN,
      verificationCode: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Watch',
      tableName: 'watches',
      underscored: true
    }
  )
  return Watch
}
