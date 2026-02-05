import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';

import authStore from '../../../stores/AuthStore';
import propertyStore from '../../../stores/PropertyStore';
import { useThemeColor } from '../../../hooks/useThemeColor';
import AddPropertyWizard from '../../../components/property/AddProperty/AddPropertyWizard';
import { initialValues as baseInitialValues } from '../../../components/property/AddProperty/validationSchemas';

const PropertyCreateScreen = observer(() => {
  const router = useRouter();
  const { id, parentId, category } = useLocalSearchParams();
  const isEditing = Boolean(id);
  const isAddingChild = Boolean(parentId);
  const isCreatingParent = Boolean(category) && !isEditing && !isAddingChild;
  const isStandalone = !isEditing && !isAddingChild && !isCreatingParent;

  const theme = useThemeColor();
  const background = theme.background;
  const primary = theme.primary;

  const isLoading = authStore.isLoading;
  const isAuthenticated = authStore.isAuthenticated;

  const [initialLoading, setInitialLoading] = useState(isEditing || isAddingChild || isCreatingParent);
  const [formInitialValues, setFormInitialValues] = useState<any>(null);

  const fetchPropertyData = useCallback(async () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (isEditing) {
      try {
        setInitialLoading(true);
        const property = await propertyStore.fetchPropertyById(id as string);
        if (property) {
          setFormInitialValues({
            agent_id: String(property.agent_id || ''),
            property_type: property.property_type || 'house',
            purpose: property.purpose || 'sale',
            title: property.title || '',
            description: property.description || '',
            area_size: property.area_size?.toString() || '',
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            province_id: property.province_id ? Number(property.province_id) : (property.provinceId ? Number(property.provinceId) : ''),
            district_id: property.district_id ? Number(property.district_id) : (property.districtId ? Number(property.districtId) : ''),
            area_id: property.area_id ? Number(property.area_id) : (property.areaId ? Number(property.areaId) : ''),
            location: property.location || property.address || '',
            address: property.address || property.location || '',
            latitude: property.latitude ? Number(property.latitude) : null,
            longitude: property.longitude ? Number(property.longitude) : null,
            is_available_for_sale: !!property.is_available_for_sale || !!property.for_sale || !!property.forSale,
            is_available_for_rent: !!property.is_available_for_rent || !!property.for_rent || !!property.forRent,
            for_sale: !!property.is_available_for_sale || !!property.for_sale || !!property.forSale || property.purpose?.toLowerCase() === 'sale' || property.purpose?.toLowerCase() === 'both',
            for_rent: !!property.is_available_for_rent || !!property.for_rent || !!property.forRent || property.purpose?.toLowerCase() === 'rent' || property.purpose?.toLowerCase() === 'both',
            sale_price: (property.sale_price || property.price || '').toString(),
            sale_currency: property.sale_currency || 'USD',
            rent_price: (property.rent_price || '').toString(),
            rent_currency: property.rent_currency || 'USD',
            media: [],
            existingMedia: (property.photos || []).map((p: string) => ({ url: p, type: 'photo' })),
            amenities: Array.isArray(property.amenities) 
              ? property.amenities 
              : (typeof property.amenities === 'string' && property.amenities.startsWith('[')
                  ? JSON.parse(property.amenities) 
                  : []),
            is_parent: !!property.is_parent,
            property_category: property.property_category || 'normal',
            parent_property_id: property.parent_property_id,
            apartment_id: property.apartment_id,
            unit_number: property.unit_number || '',
            floor: property.floor || '',
            unit_type: property.unit_type || '',
          });
        }
      } catch {
        Alert.alert('Error', 'Failed to load property data');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    } else if (isAddingChild) {
      try {
        setInitialLoading(true);
        const parent = await propertyStore.fetchPropertyById(parentId as string);
        if (parent) {
          // Determine category: Priority 1: category param, Priority 2: parent data, Priority 3: infer from type, Priority 4: 'tower'
          let activeCategory = (category as string || parent.property_category || '').toLowerCase().trim();
          
          // Normalize legacy names
          if (activeCategory === 'apartment') activeCategory = 'tower';
          
          // Infer from property_type if category is missing or 'normal'
          if (!activeCategory || activeCategory === 'normal') {
            const parentType = (parent.property_type || '').toLowerCase().trim();
            if (parentType === 'market') activeCategory = 'market';
            else if (parentType === 'tower' || parentType === 'apartment') activeCategory = 'tower';
            else if (parentType === 'sharak') activeCategory = 'sharak';
          }
          
          // Final fallback for child units
          if (!activeCategory || activeCategory === 'normal') {
            activeCategory = 'tower'; 
          }
          
          // Determine child type based on category
          let defaultType = 'apartment';
          if (activeCategory === 'market') defaultType = 'shop';
          else if (activeCategory === 'sharak') defaultType = 'house';

          setFormInitialValues({
            ...baseInitialValues,
            agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
            property_type: defaultType,
            purpose: parent.purpose || 'sale',
            province_id: parent.province_id ? Number(parent.province_id) : '',
            district_id: parent.district_id ? Number(parent.district_id) : '',
            area_id: parent.area_id ? Number(parent.area_id) : '',
            location: parent.location || parent.address || '',
            latitude: parent.latitude ? Number(parent.latitude) : null,
            longitude: parent.longitude ? Number(parent.longitude) : null,
            is_parent: false,
            record_kind: 'listing',
            parent_property_id: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            parentId: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            apartment_id: (parentId && parentId !== 'undefined') ? Number(parentId) : null,
            property_category: activeCategory,
            media: [],
            existingMedia: [],
            title: '',
            description: '',
            area_size: '',
            bedrooms: 0,
            bathrooms: 0,
            amenities: Array.isArray(parent.amenities) ? parent.amenities : [],
            is_available_for_sale: true,
            is_available_for_rent: false,
            for_sale: true,
            for_rent: false,
            sale_currency: 'USD',
            rent_currency: 'USD',
          });
        }
      } catch {
        Alert.alert('Error', 'Failed to load parent property data');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    } else if (isCreatingParent) {
      // Set initial values for creating a new parent property
      const activeCategory = (category as string || 'tower').toLowerCase();
      setFormInitialValues({
        ...baseInitialValues,
        agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
        property_category: activeCategory,
        is_parent: true,
        record_kind: 'container',
        property_type: activeCategory, 
        purpose: 'sale',
        media: [],
        existingMedia: [],
        title: '',
        description: '',
        area_size: '',
        bedrooms: 0,
        bathrooms: 0,
        is_available_for_sale: true,
        is_available_for_rent: false,
        for_sale: true,
        for_rent: false,
        sale_currency: 'USD',
        rent_currency: 'USD',
      });
      setInitialLoading(false);
    } else {
      setFormInitialValues({
        ...baseInitialValues,
        property_category: 'normal',
        is_parent: false,
        record_kind: 'listing',
        agent_id: authStore.user?.role === 'agent' ? String(authStore.user?.person_id || authStore.user?.user_id || '') : '',
        media: [],
        existingMedia: [],
        title: '',
        description: '',
        area_size: '',
        bedrooms: 0,
        bathrooms: 0,
        is_available_for_sale: true,
        is_available_for_rent: false,
        for_sale: true,
        for_rent: false,
        sale_currency: 'USD',
        rent_currency: 'USD',
        amenities: [],
      });
      setInitialLoading(false);
    }
  }, [id, parentId, category, isEditing, isAddingChild, isCreatingParent, router, isLoading, isAuthenticated]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  const handleFinish = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  if (initialLoading || authStore.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <AddPropertyWizard 
      initial={formInitialValues} 
      isEditing={isEditing} 
      propertyId={id}
      isStandalone={isStandalone}
      onFinish={handleFinish} 
    />
  );
});

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PropertyCreateScreen;
