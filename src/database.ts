import { Sequelize } from "sequelize";

let sequelize: Sequelize;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL on Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Local development: SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
  });
}

export default sequelize;
