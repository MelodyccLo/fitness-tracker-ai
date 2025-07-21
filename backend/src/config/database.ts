import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DB_CONNECTION;

if (!dbUrl) {
  console.error('DB_CONNECTION environment variable is not set.');
  process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    // You might need these options if you're deploying to a service like Heroku/Railway
    // or if your PostgreSQL requires SSL
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false // VERY important for self-signed certs or certain cloud setups
    // }
  }
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully.');
    // Optional: Sync models with the database (create tables if they don't exist)
    // await sequelize.sync({ alter: true }); // Use { force: true } only in dev to drop and recreate tables
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

export { sequelize, connectDB };