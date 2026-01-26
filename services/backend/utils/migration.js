const { sequelize } = require('../config/db');
const { Owner, Client, Person, PersonPropertyRole, Property } = require('../models');

const migrateDataToPersons = async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log('Starting data migration...');

    const owners = await Owner.findAll({ transaction });
    const clients = await Client.findAll({ transaction });
    const properties = await Property.findAll({ transaction });

    const createdPersons = {};

    for (const owner of owners) {
      const existingPerson = await Person.findOne({
        where: { phone: owner.phone },
        transaction,
      });

      let personId;
      if (existingPerson) {
        personId = existingPerson.person_id;
      } else {
        const person = await Person.create({
          full_name: owner.owner_name,
          phone: owner.phone,
          national_id: owner.cnic,
          address: owner.address,
        }, { transaction });
        personId = person.person_id;
      }

      createdPersons[`owner_${owner.owner_id}`] = personId;

      const ownedProperties = properties.filter(p => p.owner_id === owner.owner_id);
      for (const property of ownedProperties) {
        await PersonPropertyRole.create({
          person_id: personId,
          property_id: property.property_id,
          role: 'OWNER',
        }, { transaction });
      }
    }

    for (const client of clients) {
      const existingPerson = await Person.findOne({
        where: { phone: client.phone },
        transaction,
      });

      let personId;
      if (existingPerson) {
        personId = existingPerson.person_id;
      } else {
        const person = await Person.create({
          full_name: client.client_name,
          phone: client.phone,
        }, { transaction });
        personId = person.person_id;
      }

      createdPersons[`client_${client.client_id}`] = personId;
    }

    await transaction.commit();
    console.log('Migration completed successfully!');
    return createdPersons;
  } catch (error) {
    await transaction.rollback();
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = {
  migrateDataToPersons,
};
