const { sequelize } = require('./config/db');

async function fix() {
  try {
    const [results] = await sequelize.query("DESCRIBE properties");
    const hasApartmentId = results.some(r => r.Field === 'apartment_id');

    if (!hasApartmentId) {
      console.log('Adding apartment_id to properties table...');
      await sequelize.query(`
        ALTER TABLE properties 
        ADD COLUMN apartment_id INT NULL
      `);
      await sequelize.query(`
        ALTER TABLE properties
        ADD CONSTRAINT fk_properties_apartment 
        FOREIGN KEY (apartment_id) 
        REFERENCES parent_apartments(id) 
        ON DELETE SET NULL
      `);
      console.log('apartment_id added.');
    } else {
      console.log('apartment_id already exists.');
    }

    const hasUnitLabel = results.some(r => r.Field === 'unit_label');
    const hasUnitNumber = results.some(r => r.Field === 'unit_number');

    if (hasUnitLabel && !hasUnitNumber) {
      console.log('Renaming unit_label to unit_number...');
      await sequelize.query("ALTER TABLE properties CHANGE unit_label unit_number VARCHAR(100)");
    }

    console.log('Database fix completed.');
  } catch (err) {
    console.error('Error fixing database:', err);
  }
  process.exit(0);
}

fix();
