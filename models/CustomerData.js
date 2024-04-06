// models/CustomerData.js

const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const CustomerData = sequelize.define("customer_data", {
  // Define columns
  customerID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  approved_limit: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  monthly_salary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  current_debt: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.DECIMAL(15, 0).UNSIGNED,
    allowNull: false,
  },
});

module.exports = CustomerData;
