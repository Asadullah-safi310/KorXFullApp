require('dotenv').config();
const { sequelize } = require('./config/db');
async function run() {
  try {
    for (const table of ['persons', 'provinces']) {
      const [results] = await sequelize.query(`DESCRIBE ${table}`);
      console.log(`Table: ${table}`);
      console.log(JSON.stringify(results, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
