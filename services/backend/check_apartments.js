const { ParentApartment, User, Property } = require('./models');
const { initDB } = require('./config/db');

async function check() {
  await initDB();
  const aps = await ParentApartment.findAll({
    include: [
      { model: User, as: 'Agent' },
      { model: Property, as: 'Units' }
    ]
  });
  console.log('Total Apartments:', aps.length);
  aps.forEach(ap => {
    console.log(`ID: ${ap.id}, Name: ${ap.apartment_name}, Created By: ${ap.created_by} (${ap.Agent ? ap.Agent.full_name : 'N/A'}), Units: ${ap.Units ? ap.Units.length : 0}`);
  });
  process.exit(0);
}

check();
