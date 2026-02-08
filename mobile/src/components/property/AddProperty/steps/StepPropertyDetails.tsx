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
import { AnimatedFormInput } from '../../../AnimatedFormInput';

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { smoothLayout } from '../../../../utils/animations';

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
              { borderColor: theme.border, backgroundColor: 'transparent' },
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
  
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Details</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Specific information about the space.
      </AppText>

      {/* Unit Specific Fields */}
      {showUnitFields && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={{ gap: 16, marginBottom: 0 }}
        >
          <View style={styles.row}>
            {/* Apartment Number (Only for Apartment type) */}
            {values.property_type === 'apartment' && (
              <View style={{ flex: 1 }}>
                <AnimatedFormInput
                  label="Apartment No"
                  placeholder="e.g. 4B"
                  value={values.unit_number}
                  onChangeText={(text) => setFieldValue('unit_number', text)}
                  error={errors.unit_number as string}
                  touched={touched.unit_number}
                  icon={<Ionicons name="pricetag-outline" size={20} color={theme.subtext} />}
                />
              </View>
            )}
            
            {values.property_type === 'apartment' && <View style={{ width: 12 }} />}

            {/* Floor */}
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Floor"
                placeholder="e.g. 2nd"
                value={values.floor}
                onChangeText={(text) => setFieldValue('floor', text)}
                error={errors.floor as string}
                touched={touched.floor}
                icon={<MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} />}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Area Size (Hide for parents) */}
      {!values.is_parent && (
        <Animated.View layout={smoothLayout}>
          <AnimatedFormInput
            label="Total Area (Sq. Ft.)"
            placeholder="e.g. 1200"
            value={values.area_size?.toString()}
            onChangeText={(t) => setFieldValue('area_size', t)}
            error={errors.area_size as string}
            touched={touched.area_size}
            keyboardType="numeric"
            icon={<MaterialCommunityIcons name="ruler-square" size={20} color={theme.subtext} />}
          />
        </Animated.View>
      )}

      {/* Bedrooms / Bathrooms */}
      {showBedBath && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={styles.slidersRow}
        >
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
        </Animated.View>
      )}

      {/* Building Specific (For Parents) */}
      {values.is_parent && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          layout={smoothLayout}
          style={{ gap: 16 }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Total Floors"
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={values.total_floors?.toString()}
                onChangeText={(text) => setFieldValue('total_floors', text)}
                error={errors.total_floors as string}
                touched={touched.total_floors}
                icon={<MaterialCommunityIcons name="layers-outline" size={20} color={theme.subtext} />}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AnimatedFormInput
                label="Planned Units"
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={values.planned_units?.toString()}
                onChangeText={(text) => setFieldValue('planned_units', text)}
                error={errors.planned_units as string}
                touched={touched.planned_units}
                icon={<MaterialCommunityIcons name="home-group" size={20} color={theme.subtext} />}
              />
            </View>
          </View>
        </Animated.View>
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
