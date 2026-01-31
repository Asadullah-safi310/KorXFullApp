const { sequelize } = require('./config/db');

async function fix() {
  try {
    console.log('--- Adding missing columns to properties ---');
    await sequelize.query('ALTER TABLE properties ADD COLUMN is_parent BOOLEAN DEFAULT FALSE').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE properties ADD COLUMN parent_property_id INT NULL').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE properties ADD COLUMN unit_number VARCHAR(100) NULL').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE properties ADD COLUMN floor VARCHAR(50) NULL').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE properties ADD COLUMN unit_type VARCHAR(50) NULL').catch(e => console.log(e.message));
    await sequelize.query('ALTER TABLE properties ADD COLUMN title VARCHAR(255) NULL').catch(e => console.log(e.message));
    
    console.log('--- Done ---');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
