import * as Yup from 'yup';
import { propertyBaseSchema } from '../../../validation/schemas';

export const PROPERTY_CATEGORY_TYPES = {
  tower: ["apartment", "shop", "office"],
  apartment: ["apartment", "shop", "office"], // Alias for tower
  market: ["shop", "office"],
  sharak: ["apartment", "shop", "office", "land", "plot", "house"],
  normal: ["house", "apartment", "shop", "office", "land", "plot"]
};

export const PROPERTY_TYPES_CONFIG = [
  { label: 'House', value: 'house', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { label: 'Apartment', value: 'apartment', icon: 'office-building-marker-outline', activeIcon: 'office-building-marker' },
  { label: 'Shop', value: 'shop', icon: 'storefront-outline', activeIcon: 'storefront' },
  { label: 'Office', value: 'office', icon: 'briefcase-variant-outline', activeIcon: 'briefcase-variant' },
  { label: 'Land/Plot', value: 'land', icon: 'map-outline', activeIcon: 'map' },
];

export const initialValues = {
  // Step 1
  owner_person_id: '',
  agent_id: '',
  property_category: 'normal',
  record_kind: 'listing',
  property_type: '',
  purpose: 'sale',
  is_parent: false,
  parent_property_id: null,
  parentId: null,
  apartment_id: null,
  unit_number: '',
  floor: '',
  unit_type: '',
  total_floors: '',
  planned_units: '',

  // Step 2
  title: '',
  description: '',
  area_size: '',
  bedrooms: 0,
  bathrooms: 0,
  province_id: '',
  district_id: '',
  area_id: '',
  location: '',

  // Step 3
  latitude: null,
  longitude: null,

  // Step 4
  is_available_for_sale: true,
  is_available_for_rent: false,
  sale_price: '',
  sale_currency: 'AF',
  rent_price: '',
  rent_currency: 'AF',

  // Step 5
  media: [], // This will store new files to upload
  existingMedia: [], // This will store already uploaded media (for edit mode)

  // Step 6
  amenities: [],
};

export const Step1Schema = Yup.object().shape({
  owner_person_id: Yup.string().nullable(),
  agent_id: Yup.string().nullable(),
  property_category: Yup.string().oneOf(['tower', 'sharak', 'normal', 'market', 'apartment']).required('Property category is required'),
  property_type: Yup.string().required('Property type is required').test(
    'is-valid-type',
    'Invalid property type for selected category',
    function (value) {
      const { property_category, is_parent } = this.parent;
      if (!property_category || !value) return true;
      
      // If it's a parent, the type is representative
      if (is_parent) {
        return ['apartment', 'house', 'shop', 'tower', 'market', 'sharak'].includes(value.toLowerCase());
      }

      const categoryKey = property_category.toLowerCase() as keyof typeof PROPERTY_CATEGORY_TYPES;
      const allowedTypes = PROPERTY_CATEGORY_TYPES[categoryKey];
      return !!allowedTypes?.includes(value.toLowerCase());
    }
  ),
  purpose: Yup.string().when('is_parent', {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) => schema.oneOf(['sale', 'rent']).required('Purpose is required'),
  }),
  parent_property_id: Yup.number().transform((value, originalValue) => (isNaN(value) ? null : value)).nullable(),
  parentId: Yup.number().transform((value, originalValue) => (isNaN(value) ? null : value)).nullable(),
  apartment_id: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .nullable(),
  total_floors: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .nullable()
    .when(['is_parent', 'property_category'], {
      is: (isParent: boolean, category: string) => isParent && (category === 'tower' || category === 'market'),
      then: (schema) => schema.required('Number of floors is required').min(1),
      otherwise: (schema) => schema.nullable(),
    }),
  planned_units: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .nullable()
    .when(['is_parent', 'property_category'], {
      is: (isParent: boolean, category: string) => isParent && (category === 'tower' || category === 'market'),
      then: (schema) => schema.required('Planned units is required').min(1),
      otherwise: (schema) => schema.nullable(),
    }),
});

export const Step2Schema = Yup.object().shape({
  title: Yup.string().nullable(),
  description: Yup.string().required('Description is required'),
  area_size: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .typeError('Must be a number')
    .when('is_parent', {
      is: true,
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema.required('Area size is required').positive(),
    }),
  bedrooms: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when(['is_parent', 'property_type'], {
      is: (isParent: boolean, type: string) => !isParent && (type?.toLowerCase() === 'house' || type?.toLowerCase() === 'apartment'),
      then: (schema) => schema.required('Bedrooms required').min(0),
      otherwise: (schema) => schema.nullable(),
    }),
  bathrooms: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || isNaN(value) ? null : value))
    .when(['is_parent', 'property_type'], {
      is: (isParent: boolean, type: string) => !isParent && (type?.toLowerCase() === 'house' || type?.toLowerCase() === 'apartment'),
      then: (schema) => schema.required('Bathrooms required').min(0),
      otherwise: (schema) => schema.nullable(),
    }),
  unit_number: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id', 'property_type'], {
    is: (parentPropId: any, parentId: any, apartmentId: any, type: string) => 
      ((parentPropId != null && parentPropId !== '') || 
      (parentId != null && parentId !== '') || 
      (apartmentId != null && apartmentId !== '')) && 
      type === 'apartment',
    then: (schema) => schema.required('Apartment number is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  floor: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (parentPropId: any, parentId: any, apartmentId: any) => 
      (parentPropId != null && parentPropId !== '') || 
      (parentId != null && parentId !== '') || 
      (apartmentId != null && apartmentId !== ''),
    then: (schema) => schema.required('Floor is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  province_id: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (parentPropId: any, parentId: any, apartmentId: any) => parentPropId == null && parentId == null && apartmentId == null,
    then: (schema) => schema.required('City is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  district_id: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (parentPropId: any, parentId: any, apartmentId: any) => parentPropId == null && parentId == null && apartmentId == null,
    then: (schema) => schema.required('District is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  area_id: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (parentPropId: any, parentId: any, apartmentId: any) => parentPropId == null && parentId == null && apartmentId == null,
    then: (schema) => schema.required('Region is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  location: Yup.string().when(['parent_property_id', 'parentId', 'apartment_id'], {
    is: (parentPropId: any, parentId: any, apartmentId: any) => parentPropId == null && parentId == null && apartmentId == null,
    then: (schema) => schema.required('Location is required'),
    otherwise: (schema) => schema.nullable(),
  }),
});

export const Step3Schema = Yup.object().shape({
  latitude: Yup.number().nullable(),
  longitude: Yup.number().nullable(),
});

export const Step4Schema = Yup.object().shape({
  is_available_for_sale: propertyBaseSchema.is_available_for_sale,
  is_available_for_rent: propertyBaseSchema.is_available_for_rent,
  sale_price: propertyBaseSchema.sale_price,
  sale_currency: Yup.string().when('sale_price', {
    is: (val: any) => val && parseFloat(val) > 0,
    then: (schema) => schema.required('Currency is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  rent_price: propertyBaseSchema.rent_price,
  rent_currency: Yup.string().when('rent_price', {
    is: (val: any) => val && parseFloat(val) > 0,
    then: (schema) => schema.required('Currency is required'),
    otherwise: (schema) => schema.nullable(),
  }),
}).test('at-least-one-purpose', 'Must be available for either sale or rent', function(value) {
    return value.is_available_for_sale || value.is_available_for_rent;
});

export const Step5Schema = Yup.object().shape({
  media: Yup.array(),
}).test('at-least-one-image', 'At least one image is required', function() {
    const { media, existingMedia } = this.parent || {};
    return (media?.length || 0) + (existingMedia?.length || 0) > 0;
});

export const Step6Schema = Yup.object().shape({
  amenities: Yup.array(),
});

export const Step7Schema = Yup.object().shape({});

export const stepSchemas = [
  Step1Schema,
  Step2Schema,
  Step3Schema,
  Step4Schema,
  Step5Schema,
  Step6Schema,
  Step7Schema,
];
