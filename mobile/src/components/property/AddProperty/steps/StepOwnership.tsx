import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { AppText } from '../../../AppText';
import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { PROPERTY_CATEGORY_TYPES, PROPERTY_TYPES_CONFIG } from '../validationSchemas';
import { propertyService } from '../../../../services/property.service';

const { width } = Dimensions.get('window');

const StepOwnership = observer(({ isStandalone, isEditing, isAddingChild: isAddingChildProp }: any) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const [parentName, setParentName] = useState<string>('');
  const [loadingParent, setLoadingParent] = useState(false);

  useEffect(() => {
    const parentId = values.parent_property_id || values.parentId || values.apartment_id;
    if (parentId && !parentName) {
      setLoadingParent(true);
      propertyService.getPropertyById(parentId)
        .then(res => setParentName(res.title))
        .catch(() => setParentName('Parent Property'))
        .finally(() => setLoadingParent(false));
    }
  }, [values.parent_property_id, values.parentId, values.apartment_id]);

  useEffect(() => {
    if (isStandalone && !isEditing && !isAddingChild) {
      setFieldValue('property_category', 'normal');
      setFieldValue('parent_id', null);
      setFieldValue('record_kind', 'listing');
      setFieldValue('is_parent', false);
    }
  }, [isStandalone, isEditing]);

  const { normalizedCategory, propertyTypes, isAddingChild } = useMemo(() => {
    const addingChild = isAddingChildProp || 
                        !!values.parent_property_id || 
                        !!values.parentId || 
                        !!values.apartment_id ||
                        (!values.is_parent && values.property_category && values.property_category !== 'normal');

    let rawCat = (values.property_category || '').toLowerCase().trim();
    
    if (addingChild && (rawCat === '' || rawCat === 'normal')) {
      rawCat = 'tower';
    } else if (rawCat === '') {
      rawCat = 'normal';
    }
    
    const normCat = (rawCat === 'apartment' || rawCat === 'tower') ? 'tower' : 
                    (rawCat === 'market') ? 'market' :
                    (rawCat === 'sharak') ? 'sharak' : 'normal';

    const categoryKey = normCat as keyof typeof PROPERTY_CATEGORY_TYPES;
    const allowedTypesList = PROPERTY_CATEGORY_TYPES[categoryKey] || [];

    const lowerAllowed = allowedTypesList.map(t => t.toLowerCase());
    const filteredTypes = PROPERTY_TYPES_CONFIG.filter(type => 
      lowerAllowed.includes(type.value.toLowerCase())
    );

    return { 
      normalizedCategory: normCat, 
      propertyTypes: filteredTypes,
      isAddingChild: addingChild
    };
  }, [values.property_category, values.is_parent, values.parent_property_id, values.parentId, values.apartment_id, isAddingChildProp]);

  useEffect(() => {
    // Ensure property_type is set if it's empty but required
    if (!values.property_type) {
      if (values.is_parent && normalizedCategory !== 'normal') {
        setFieldValue('property_type', normalizedCategory);
      } else if (propertyTypes.length === 1) {
        setFieldValue('property_type', propertyTypes[0].value);
      }
    }
  }, [values.property_type, values.is_parent, normalizedCategory, propertyTypes]);

  // Handle category change (for when user can pick category - e.g. adding a new parent)
  const handleCategoryChange = (category: string) => {
    setFieldValue('property_category', category);
    if (category !== 'normal') {
      setFieldValue('is_parent', true);
      setFieldValue('record_kind', 'container');
      setFieldValue('property_type', category); 
    } else {
      setFieldValue('is_parent', false);
      setFieldValue('record_kind', 'listing');
      const newAllowedTypes = PROPERTY_CATEGORY_TYPES[category as keyof typeof PROPERTY_CATEGORY_TYPES] || [];
      if (!newAllowedTypes.includes(values.property_type)) {
        setFieldValue('property_type', newAllowedTypes[0] || '');
      }
    }
  };

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  const showCategorySelection = !isStandalone && !isEditing && !isAddingChild;

  // Title Logic
  const mainTitle = isAddingChild 
    ? `Add ${values.property_type ? values.property_type.charAt(0).toUpperCase() + values.property_type.slice(1) : 'Unit'}`
    : values.is_parent 
      ? `Add New ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}`
      : 'Add Standalone Property';

  const subTitle = isAddingChild && parentName 
    ? `Inside ${parentName}` 
    : 'Let\'s start with the basics';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1" weight="bold" style={{ color: theme.text }}>{mainTitle}</AppText>
        <AppText variant="small" style={{ color: theme.subtext, marginTop: 4 }}>{subTitle}</AppText>
      </View>

      {/* Context Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: theme.primary + '15' }]}>
          <MaterialCommunityIcons name="tag-outline" size={14} color={theme.primary} />
          <AppText variant="tiny" weight="bold" style={{ color: theme.primary, marginLeft: 6, textTransform: 'capitalize' }}>
            Category: {normalizedCategory}
          </AppText>
        </View>
        {isAddingChild && (
          <View style={[styles.chip, { backgroundColor: theme.secondary + '15' }]}>
            <MaterialCommunityIcons name="office-building-outline" size={14} color={theme.secondary} />
            <AppText variant="tiny" weight="bold" style={{ color: theme.secondary, marginLeft: 6 }}>
              Inside: {parentName || '...'}
            </AppText>
          </View>
        )}
      </View>

      {/* Category Selection (Only if adding a new parent or listing from scratch) */}
      {showCategorySelection && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text, marginBottom: 12 }}>I am adding a...</AppText>
          <View style={styles.categoryGrid}>
            {['normal', 'tower', 'market', 'sharak'].map((cat) => {
              const isActive = normalizedCategory === cat;
              const config = {
                normal: { label: 'Single Property', icon: 'home-outline', desc: 'House, Land, Shop' },
                tower: { label: 'Tower/Building', icon: 'office-building-outline', desc: 'Apartment Complex' },
                market: { label: 'Market', icon: 'store-outline', desc: 'Shopping Center' },
                sharak: { label: 'Community', icon: 'home-group', desc: 'Residential Area' },
              }[cat as 'normal' | 'tower' | 'market' | 'sharak'];

              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' }
                  ]}
                  onPress={() => handleCategoryChange(cat)}
                >
                  <View style={[styles.iconCircle, isActive && { backgroundColor: theme.primary + '15' }]}>
                    <MaterialCommunityIcons name={config.icon as any} size={24} color={isActive ? theme.primary : theme.subtext} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText weight="bold" style={{ color: theme.text }}>{config.label}</AppText>
                    <AppText variant="tiny" style={{ color: theme.subtext }}>{config.desc}</AppText>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Property Type Grid (If not a parent or if it's a normal listing) */}
      {(!values.is_parent || normalizedCategory === 'normal') && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text, marginBottom: 4 }}>What kind of property?</AppText>
          <AppText variant="small" style={{ color: theme.subtext, marginBottom: 20 }}>Select the specific type</AppText>
          
          <View style={styles.typeGrid}>
            {propertyTypes.map((type) => {
              const isActive = values.property_type === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  activeOpacity={0.7}
                  style={[
                    styles.typeCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => setFieldValue('property_type', type.value)}
                >
                  <MaterialCommunityIcons
                    name={(isActive ? type.activeIcon : type.icon) as any}
                    size={28}
                    color={isActive ? theme.primary : theme.subtext}
                  />
                  <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext, marginTop: 8, textAlign: 'center' }}>
                    {type.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('property_type')}
        </View>
      )}

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  section: {
    marginBottom: 30,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 52) / 3,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  errorText: { 
    marginTop: 8, 
    color: '#ff4444',
  },
});

export default StepOwnership;
