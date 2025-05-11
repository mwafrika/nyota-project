import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.POSTGRES_DB, "process.env.POSTGRES_DB");

export default {
  development: {
    dialect: "postgres",
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: 5432,
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
  test: {
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    dialect: "postgres",
    host: process.env.TEST_DB_HOSTNAME,
    port: 5432,
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    port: process.env.PROD_DB_PORT,
    dialectModule: pg,
    dialect: "postgres",
    dialectOptions: {
      bigNumberStrings: true,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
