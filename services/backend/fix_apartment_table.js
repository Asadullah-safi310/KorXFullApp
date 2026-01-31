const { sequelize } = require('./config/db');

async function fixApartmentTable() {
  try {
    console.log('Starting apartment table fix...');
    
    // Add total_floors
    try {
      await sequelize.query(`ALTER TABLE parent_apartments ADD COLUMN total_floors INTEGER DEFAULT NULL AFTER longitude`);
      console.log('Added total_floors column');
    } catch (err) {
      if (err.original && err.original.errno === 1060) {
        console.log('total_floors column already exists');
      } else {
        throw err;
      }
    }

    // Add total_units
    try {
      await sequelize.query(`ALTER TABLE parent_apartments ADD COLUMN total_units INTEGER DEFAULT NULL AFTER total_floors`);
      console.log('Added total_units column');
    } catch (err) {
      if (err.original && err.original.errno === 1060) {
        console.log('total_units column already exists');
      } else {
        throw err;
      }
    }

    console.log('Apartment table fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix apartment table:', error);
    process.exit(1);
  }
}

fixApartmentTable();
