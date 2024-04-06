const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  "db_sahil",
  "sahil",
  "AVNS_wQXoHpfqfFte6xiStpe",
  {
    host: "sahil-sql-intern-project.a.aivencloud.com",

    port: 24239,
    dialect: "mysql",
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    define: {
      timestamps: false,
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the database has been established successfully."
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;
