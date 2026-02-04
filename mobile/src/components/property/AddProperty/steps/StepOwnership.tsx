import React, { useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { AppText } from '../../../AppText';
import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import personStore from '../../../../stores/PersonStore';
import authStore from '../../../../stores/AuthStore';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import Avatar from '../../../../components/Avatar';
import { PROPERTY_CATEGORY_TYPES, PROPERTY_TYPES_CONFIG } from '../validationSchemas';
import { propertyService } from '../../../../services/property.service';
import { Property } from '../../../../types';

const { width } = Dimensions.get('window');

const StepOwnership = observer(({ isStandalone, isEditing, isAddingChild: isAddingChildProp }: any) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  useEffect(() => {
    if (personStore.agents.length === 0) personStore.fetchAgents();
    if (authStore.isAdmin && personStore.persons.length === 0) personStore.fetchPersons();
  }, []);

  const categories = ['normal', 'tower', 'market', 'sharak'];

  useEffect(() => {
    if (isStandalone && !isEditing && !isAddingChild) {
      setFieldValue('property_category', 'normal');
      setFieldValue('parent_id', null);
      setFieldValue('record_kind', 'listing');
      setFieldValue('is_parent', false);
    }
  }, [isStandalone, isEditing, isAddingChild]);

  // Use useMemo to ensure propertyTypes and normalizedCategory are calculated consistently
  const { normalizedCategory, propertyTypes, isAddingChild } = useMemo(() => {
    const addingChild = isAddingChildProp || 
                        !!values.parent_property_id || 
                        !!values.parentId || 
                        !!values.apartment_id ||
                        (!values.is_parent && values.property_category && values.property_category !== 'normal');

    let rawCat = (values.property_category || '').toLowerCase().trim();
    
    // If adding a child and category is unspecified or 'normal', force it to a container category
    if (addingChild && (rawCat === '' || rawCat === 'normal')) {
      // Try to determine from context or default to tower
      rawCat = 'tower';
    } else if (rawCat === '') {
      rawCat = 'normal';
    }
    
    // Normalize category for type mapping
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

  // Hide category for Standalone (Rule 1), units, and editing.
  const showCategory = !isStandalone && !isEditing && !isAddingChild && values.is_parent;

  const showPropertyType = !values.is_parent && propertyTypes.length > 0;

  const handleCategoryChange = (category: string) => {
    setFieldValue('property_category', category);
    
    if (category !== 'normal') {
      setFieldValue('is_parent', true);
      setFieldValue('record_kind', 'container');
      // For parents, property_type should be the building type (tower/market/sharak)
      setFieldValue('property_type', category); 
    } else {
      setFieldValue('is_parent', false);
      setFieldValue('record_kind', 'listing');
      const newAllowedTypes = PROPERTY_CATEGORY_TYPES[category as keyof typeof PROPERTY_CATEGORY_TYPES] || [];
      if (!newAllowedTypes.includes(values.property_type)) {
        setFieldValue('property_type', newAllowedTypes[0] || '');
      }
    }
    
    setFieldValue('parent_property_id', null);
  };
  
  const purposes = [
    { label: 'Sale', value: 'sale', icon: 'handshake' },
    { label: 'Rent', value: 'rent', icon: 'calendar-clock-outline' },
  ];

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Property Category Selection */}
      {showCategory && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Property Category</AppText>
          <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>Select the category of your property</AppText>
          
          <View style={styles.categoryRow}>
            {categories.map((cat) => {
              const isActive = normalizedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => handleCategoryChange(cat)}
                >
                  <AppText weight="bold" style={{ color: isActive ? theme.text : theme.subtext, textTransform: 'capitalize' }}>
                    {cat}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('property_category')}
        </View>
      )}

      {/* Parent Building Details */}
      {values.is_parent && !isAddingChild && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Building Information</AppText>
          <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>Enter general building statistics</AppText>
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" weight="semiBold" style={{ color: theme.subtext, marginBottom: 8 }}>Total Floors</AppText>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} />
                <TextInput 
                  style={{ flex: 1, height: 48, marginLeft: 10, color: theme.text }}
                  placeholder="e.g. 10"
                  placeholderTextColor={theme.subtext}
                  keyboardType="numeric"
                  value={values.total_floors?.toString()}
                  onChangeText={(text) => setFieldValue('total_floors', text)}
                />
              </View>
              {renderError('total_floors')}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppText variant="small" weight="semiBold" style={{ color: theme.subtext, marginBottom: 8 }}>
                {normalizedCategory === 'tower' ? 'No-of-homes planned' : 
                 normalizedCategory === 'market' ? 'No-of-shops planned' : 'Planned Units'}
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="home-group" size={20} color={theme.subtext} />
                <TextInput 
                  style={{ flex: 1, height: 48, marginLeft: 10, color: theme.text }}
                  placeholder="e.g. 50"
                  placeholderTextColor={theme.subtext}
                  keyboardType="numeric"
                  value={values.planned_units?.toString()}
                  onChangeText={(text) => setFieldValue('planned_units', text)}
                />
              </View>
              {renderError('planned_units')}
            </View>
          </View>
        </View>
      )}

      {/* Property Type Selection */}
      {showPropertyType && (
        <View style={[styles.section, !values.property_category && { opacity: 0.5 }]}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Property Type</AppText>
          <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
            {!values.property_category ? 'Please select a category first' : 'What kind of property are you listing?'}
          </AppText>
          
          <View style={styles.grid}>
            {propertyTypes.map((type) => {
              const isActive = values.property_type === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  disabled={!values.property_category}
                  activeOpacity={0.7}
                  style={[
                    styles.typeCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => setFieldValue('property_type', type.value)}
                >
                  <View style={[styles.iconCircle, isActive && { backgroundColor: theme.primary + '15' }]}>
                    <MaterialCommunityIcons
                      name={(isActive ? type.activeIcon : type.icon) as any}
                      size={22}
                      color={isActive ? theme.primary : theme.subtext}
                    />
                  </View>
                  <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext }}>
                    {type.label}
                  </AppText>
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color={theme.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('property_type')}
        </View>
      )}

      {/* Purpose Selection */}
      {!values.is_parent && (
        <View style={styles.section}>
          <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Listing Purpose</AppText>
          <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>Is this for sale or long-term rent?</AppText>
          
          <View style={styles.purposeRow}>
            {purposes.map((p) => {
              const isActive = values.purpose === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  activeOpacity={0.7}
                  style={[
                    styles.purposeCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => setFieldValue('purpose', p.value)}
                >
                  <MaterialCommunityIcons
                    name={p.icon as any}
                    size={24}
                    color={isActive ? theme.primary : theme.subtext}
                  />
                  <AppText weight="bold" style={{ color: isActive ? theme.text : theme.subtext }}>
                    For {p.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('purpose')}
        </View>
      )}

      {/* Owner Assignment (Admin Only) */}
      {authStore.isAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Assign Owner</AppText>
              <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>Select the property owner</AppText>
            </View>
            <View style={[styles.optionalBadge, { backgroundColor: theme.border + '30' }]}>
              <AppText variant="tiny" weight="bold" style={{ color: theme.subtext }}>ADMIN</AppText>
            </View>
          </View>
          
          {personStore.loading && personStore.persons.length === 0 ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentScroll}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.agentCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  !values.owner_person_id && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                ]}
                onPress={() => setFieldValue('owner_person_id', '')}
              >
                <View style={[styles.noneAvatar, { backgroundColor: theme.border + '50' }]}>
                  <Ionicons name="person-outline" size={24} color={theme.subtext} />
                </View>
                <AppText variant="tiny" weight="bold" style={{ color: !values.owner_person_id ? theme.text : theme.subtext }}>Current User</AppText>
              </TouchableOpacity>

              {personStore.persons.map((person) => {
                const isActive = values.owner_person_id === String(person.person_id);
                return (
                  <TouchableOpacity
                    key={person.person_id}
                    activeOpacity={0.7}
                    style={[
                      styles.agentCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                    ]}
                    onPress={() => setFieldValue('owner_person_id', String(person.person_id))}
                  >
                    <Avatar user={person} size="md" />
                    <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext }} numberOfLines={1}>
                      {person.full_name?.split(' ')[0] || 'Unknown'}
                    </AppText>
                    <AppText variant="tiny" weight="medium" style={{ color: theme.subtext }}>Owner</AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {renderError('owner_person_id')}
        </View>
      )}

      {/* Agent Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Assign Agent</AppText>
            <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>Who will manage this listing?</AppText>
          </View>
          <View style={[styles.optionalBadge, { backgroundColor: theme.border + '30' }]}>
            <AppText variant="tiny" weight="bold" style={{ color: theme.subtext }}>OPTIONAL</AppText>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentScroll}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.agentCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              !values.agent_id && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
            ]}
            onPress={() => setFieldValue('agent_id', '')}
          >
            <View style={[styles.noneAvatar, { backgroundColor: theme.border + '50' }]}>
              <Ionicons name="person-remove-outline" size={24} color={theme.subtext} />
            </View>
            <AppText variant="tiny" weight="bold" style={{ color: !values.agent_id ? theme.text : theme.subtext }}>No Agent</AppText>
          </TouchableOpacity>

          {personStore.agents.map((agent) => {
            const isActive = values.agent_id === String(agent.user_id);
            return (
              <TouchableOpacity
                key={agent.user_id}
                activeOpacity={0.7}
                style={[
                  styles.agentCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                ]}
                onPress={() => setFieldValue('agent_id', String(agent.user_id))}
              >
                <Avatar user={agent} size="md" />
                <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext }} numberOfLines={1}>
                  {agent.full_name.split(' ')[0]}
                </AppText>
                <AppText variant="tiny" weight="medium" style={{ color: theme.subtext }}>Agent</AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {renderError('agent_id')}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionSubtitle: {
    marginBottom: 16,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: (width - 40 - 24) / 4,
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purposeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  purposeCard: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  agentScroll: {
    gap: 12,
    paddingRight: 20,
  },
  agentCard: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  noneAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    marginLeft: 4,
  },
});

export default StepOwnership;
