const { sequelize } = require('./config/db');
const { User, Property, Deal, Person, Province } = require('./models');

async function check() {
  try {
    console.log('--- User Columns ---');
    const userDesc = await sequelize.queryInterface.describeTable('users');
    console.log(Object.keys(userDesc));

    console.log('--- Property Columns ---');
    const propDesc = await sequelize.queryInterface.describeTable('properties');
    console.log(Object.keys(propDesc));

    console.log('--- Deal Columns ---');
    const dealDesc = await sequelize.queryInterface.describeTable('deals');
    console.log(Object.keys(dealDesc));

    console.log('--- Province Columns ---');
    const provDesc = await sequelize.queryInterface.describeTable('provinces');
    console.log(Object.keys(provDesc));

    console.log('--- Person Columns ---');
    const persDesc = await sequelize.queryInterface.describeTable('persons');
    console.log(Object.keys(persDesc));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
