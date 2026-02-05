import React from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';

const CustomSlider = ({ label, value, onChange, min = 0, max = 10 }: any) => {
  const theme = useThemeColor();
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>{label}</AppText>
        <View style={[styles.sliderBadge, { backgroundColor: theme.primary + '15' }]}>
          <AppText variant="caption" weight="bold" style={{ color: theme.primary }}>
            {value === max ? `${max}+` : value}
          </AppText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderTrack}>
        {[...Array(max + 1).keys()].map((num) => (
          <TouchableOpacity
            key={num}
            activeOpacity={0.7}
            style={[
              styles.sliderThumb,
              { borderColor: theme.border, backgroundColor: theme.card },
              value === num && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => onChange(num)}
          >
            <AppText weight="bold" style={[{ color: theme.text }, value === num && { color: theme.white }]}>
              {num === max ? `${max}+` : num}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const StepPropertyDetails = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  const isAddingChild = !!(values.parent_property_id || values.parentId || values.apartment_id) || 
                        (!values.is_parent && values.property_category && values.property_category !== 'normal');

  const showBedBath = !values.is_parent && (values.property_type === 'house' || values.property_type === 'apartment');
  const showUnitFields = isAddingChild && (values.property_type === 'apartment' || values.property_type === 'shop' || values.property_type === 'office');
  
  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>{errors[field] as string}</AppText>;
    }
    return null;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Details</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Specific information about the space.
      </AppText>

      {/* Unit Specific Fields */}
      {showUnitFields && (
        <View style={{ gap: 16, marginBottom: 20 }}>
          <View style={styles.row}>
            {/* Apartment Number (Only for Apartment type) */}
            {values.property_type === 'apartment' && (
              <View style={{ flex: 1 }}>
                <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Apartment Number</AppText>
                <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                  <Ionicons name="pricetag-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                  <TextInput 
                    style={[styles.input, { color: theme.text }]}
                    placeholder="e.g. 4B"
                    placeholderTextColor={theme.text + '40'}
                    value={values.unit_number}
                    onChangeText={(text) => setFieldValue('unit_number', text)}
                  />
                </View>
                {renderError('unit_number')}
              </View>
            )}
            
            {values.property_type === 'apartment' && <View style={{ width: 12 }} />}

            {/* Floor */}
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Floor</AppText>
              <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                <MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. 2nd"
                  placeholderTextColor={theme.text + '40'}
                  value={values.floor}
                  onChangeText={(text) => setFieldValue('floor', text)}
                />
              </View>
              {renderError('floor')}
            </View>
          </View>
        </View>
      )}

      {/* Area Size (Hide for parents) */}
      {!values.is_parent && (
        <View style={styles.inputGroup}>
          <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Total Area</AppText>
          <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
            <MaterialCommunityIcons name="ruler-square" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={values.area_size?.toString()}
              onChangeText={(t) => setFieldValue('area_size', t)}
              placeholder="e.g. 1200"
              placeholderTextColor={theme.text + '40'}
              keyboardType="numeric"
            />
            <View style={[styles.unitBadge, { backgroundColor: theme.border + '30' }]}>
              <AppText variant="tiny" weight="bold" style={{ color: theme.subtext }}>Sq. Ft.</AppText>
            </View>
          </View>
          {renderError('area_size')}
        </View>
      )}

      {/* Bedrooms / Bathrooms */}
      {showBedBath && (
        <View style={styles.slidersRow}>
          <CustomSlider
            label="Bedrooms"
            value={values.bedrooms}
            onChange={(v: number) => setFieldValue('bedrooms', v)}
          />
          <CustomSlider
            label="Bathrooms"
            value={values.bathrooms}
            onChange={(v: number) => setFieldValue('bathrooms', v)}
          />
        </View>
      )}

      {/* Building Specific (For Parents) */}
      {values.is_parent && (
        <View style={{ gap: 16 }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Total Floors</AppText>
              <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                <MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. 10"
                  placeholderTextColor={theme.text + '40'}
                  keyboardType="numeric"
                  value={values.total_floors?.toString()}
                  onChangeText={(text) => setFieldValue('total_floors', text)}
                />
              </View>
              {renderError('total_floors')}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="semiBold" style={{ color: theme.text }}>Planned Units</AppText>
              <View style={[styles.textInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                <MaterialCommunityIcons name="home-group" size={20} color={theme.subtext} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. 50"
                  placeholderTextColor={theme.text + '40'}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionSubtitle: { 
    marginBottom: 20,
    marginTop: 2,
  },
  inputGroup: { 
    marginBottom: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  row: { 
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slidersRow: {
    gap: 10,
  },
  sliderContainer: { 
    marginBottom: 16,
  },
  sliderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sliderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sliderTrack: { 
    paddingHorizontal: 4, 
    gap: 12,
  },
  sliderThumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
});

export default StepPropertyDetails;
