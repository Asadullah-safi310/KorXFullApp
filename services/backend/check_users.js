const { User } = require('./models');
const { initDB } = require('./config/db');

async function check() {
  await initDB();
  const users = await User.findAll();
  console.log('Total Users:', users.length);
  users.forEach(u => {
    console.log(`ID: ${u.user_id}, Name: ${u.full_name}, Phone: ${u.phone}, Role: ${u.role}`);
  });
  process.exit(0);
}

check();
