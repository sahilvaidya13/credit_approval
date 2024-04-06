// models/Loan.js
const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const Loan = sequelize.define(
  "loan_data",
  {
    customerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    loanID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    loan_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tenure: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    monthly_payment: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emi_paid_ontime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_of_approval: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    end_date: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Loan;
