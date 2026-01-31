const { sequelize } = require('./config/db');
const { User, ParentApartment } = require('./models');

async function checkData() {
  try {
    await sequelize.authenticate();
    
    // Find Asadullah Safi
    const user = await User.findOne({
      where: { full_name: 'Asadullah Safi' }
    });
    
    if (!user) {
      console.log('User Asadullah Safi not found');
      return;
    }
    
    console.log(`User found: ${user.full_name}, ID: ${user.user_id}`);
    
    // Find apartments by this user
    const apartments = await ParentApartment.findAll({
      where: { created_by: user.user_id }
    });
    
    console.log(`Found ${apartments.length} apartments created by user ID ${user.user_id}`);
    apartments.forEach(apt => {
      console.log(`- ID: ${apt.id}, Name: ${apt.apartment_name}, Status: ${apt.status}, CreatedBy: ${apt.created_by}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkData();
