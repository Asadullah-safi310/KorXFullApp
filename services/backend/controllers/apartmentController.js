const { ParentApartment, Property, User, Province, District, Area } = require('../models');
const { validationResult } = require('express-validator');

const createApartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      apartment_name,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      total_floors,
      total_units,
      description,
      facilities,
      building_images,
    } = req.body;

    const apartment = await ParentApartment.create({
      apartment_name,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      total_floors,
      total_units,
      description,
      facilities,
      building_images: building_images || [],
      created_by: req.user.user_id,
      status: 'active',
    });

    res.status(201).json(apartment);
  } catch (error) {
    console.error('Error creating apartment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getApartments = async (req, res) => {
  try {
    const apartments = await ParentApartment.findAll({
      where: { status: 'active' },
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(apartments);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAgentApartments = async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'admin') {
      where.created_by = req.user.user_id;
    }
    
    const apartments = await ParentApartment.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { 
          model: Property, 
          as: 'Units', 
          attributes: ['property_id'] 
        }
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(apartments);
  } catch (error) {
    console.error('Error fetching agent apartments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getApartmentById = async (req, res) => {
  try {
    const apartment = await ParentApartment.findByPk(req.params.id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        {
          model: Property,
          as: 'Units',
          include: [
            { model: Province, as: 'ProvinceData', attributes: ['name'] },
            { model: District, as: 'DistrictData', attributes: ['name'] },
          ]
        },
        { model: User, as: 'Agent', attributes: ['full_name', 'email'] }
      ],
    });

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    res.json(apartment);
  } catch (error) {
    console.error('Error fetching apartment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getApartmentUnits = async (req, res) => {
  try {
    const where = { 
      apartment_id: req.params.id
    };

    // If no user is logged in, show only available units
    if (!req.user) {
      where.status = 'available';
    }

    const units = await Property.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(units);
  } catch (error) {
    console.error('Error fetching apartment units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const uploadApartmentFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const apartment = await ParentApartment.findByPk(id);

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    if (req.user && req.user.user_id !== apartment.created_by && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to upload files to this apartment' });
    }

    const building_images = [];
    if (req.files) {
      req.files.forEach(file => {
        building_images.push(`/uploads/${file.filename}`);
      });
    }

    const existingImages = Array.isArray(apartment.building_images) ? apartment.building_images : [];
    await apartment.update({
      building_images: [...existingImages, ...building_images]
    });

    res.json({
      message: 'Images uploaded successfully',
      building_images: [...existingImages, ...building_images]
    });
  } catch (error) {
    console.error('Error uploading apartment files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateApartment = async (req, res) => {
  const { id } = req.params;
  console.log(`UPDATE REQUEST: Method=${req.method} ID=${id} Path=${req.path}`);
  
  try {
    const {
      apartment_name,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      total_floors,
      total_units,
      description,
      facilities,
    } = req.body;

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid Apartment ID provided' });
    }

    const apartment = await ParentApartment.findByPk(id);

    if (!apartment) {
      console.log(`Apartment NOT FOUND in database for ID: ${id}`);
      return res.status(404).json({ error: `Update failed: Apartment with ID ${id} was not found in database` });
    }

    if (req.user.user_id !== apartment.created_by && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this apartment' });
    }

    await apartment.update({
      apartment_name,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      total_floors,
      total_units,
      description,
      facilities,
    });

    const updatedApartment = await ParentApartment.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
      ]
    });

    res.json(updatedApartment);
  } catch (error) {
    console.error('Error updating apartment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteApartment = async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE REQUEST: Method=${req.method} ID=${id} Path=${req.path}`);
  
  try {
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid Apartment ID provided for deletion' });
    }

    const apartment = await ParentApartment.findByPk(id);

    if (!apartment) {
      console.log(`Apartment NOT FOUND for delete: ID ${id}`);
      return res.status(404).json({ error: `Delete failed: Apartment with ID ${id} was not found in database` });
    }

    if (req.user.user_id !== apartment.created_by && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this apartment' });
    }

    // Instead of hard delete, we could set status to inactive
    await apartment.update({ status: 'inactive' });

    res.json({ message: 'Apartment deleted successfully' });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteApartmentFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl } = req.body;
    const apartment = await ParentApartment.findByPk(id);

    if (!apartment) {
      return res.status(404).json({ error: `Delete file failed: Apartment not found with ID: ${id}` });
    }

    if (req.user.user_id !== apartment.created_by && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete files from this apartment' });
    }

    const building_images = Array.isArray(apartment.building_images) ? apartment.building_images : [];
    const updatedImages = building_images.filter(img => img !== fileUrl);

    await apartment.update({ building_images: updatedImages });

    const updatedApartment = await ParentApartment.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
      ]
    });

    res.json(updatedApartment);
  } catch (error) {
    console.error('Error deleting apartment file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createApartment,
  getApartments,
  getAgentApartments,
  getApartmentById,
  getApartmentUnits,
  uploadApartmentFiles,
  updateApartment,
  deleteApartment,
  deleteApartmentFile,
};
