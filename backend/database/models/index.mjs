import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Sequelize from "sequelize";
import process from "process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// Import the database config
import databaseConfig from "../../config/database.js";
const config = databaseConfig[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Load model files
const modelFiles = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".js" &&
    file !== "index.js" &&
    file.indexOf(".test.js") === -1
  );
});

// Load models dynamically
for (const file of modelFiles) {
  const model = require(path.join(__dirname, file))(
    sequelize,
    Sequelize.DataTypes
  );
  db[model.name] = model;
}

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export const Note = db.Note;
export default db;
