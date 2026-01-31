const { User, Property, Deal, Person, Province } = require('./models');

async function test() {
  try {
    console.log('Fetching totalUsers...');
    const totalUsers = await User.count();
    console.log('totalUsers:', totalUsers);

    console.log('Fetching totalAgents...');
    const totalAgents = await User.count({ where: { role: 'agent' } });
    console.log('totalAgents:', totalAgents);

    console.log('Fetching totalProperties...');
    const totalProperties = await Property.count();
    console.log('totalProperties:', totalProperties);

    console.log('Fetching propertiesForSale...');
    const propertiesForSale = await Property.count({ where: { is_available_for_sale: true } });
    console.log('propertiesForSale:', propertiesForSale);

    console.log('Fetching recentProperties...');
    const recentProperties = await Property.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['full_name'] },
        { model: Province, as: 'ProvinceData', attributes: ['name'] }
      ]
    });
    console.log('recentProperties count:', recentProperties.length);

    console.log('Fetching recentUsers...');
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['user_id', 'full_name', 'email', 'role', 'createdAt']
    });
    console.log('recentUsers count:', recentUsers.length);

    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

test();
