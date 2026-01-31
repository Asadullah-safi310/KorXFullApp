const { sequelize } = require('./config/db');

async function check() {
  try {
    const [results] = await sequelize.query("DESCRIBE properties");
    console.log('Columns in properties table:');
    results.forEach(r => console.log(r.Field));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
