import React from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  Switch
} from 'react-native';
import { useFormikContext } from 'formik';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../AppText';
import { AnimatedFormInput } from '../../../AnimatedFormInput';

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { smoothLayout } from '../../../../utils/animations';

const ToggleCard = ({ label, value, onValueChange, icon, description }: any) => {
  const theme = useThemeColor();
  return (
    <View style={[
      styles.toggleCard, 
      { backgroundColor: theme.card, borderColor: value ? theme.primary : theme.border }
    ]}>
      <View style={styles.toggleHeader}>
        <View style={[styles.iconContainer, { backgroundColor: value ? theme.primary + '15' : theme.border + '15' }]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={value ? theme.primary : theme.subtext} 
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="title" weight="bold" style={{ color: theme.text }}>{label}</AppText>
          <AppText variant="tiny" style={{ color: theme.subtext }}>{description}</AppText>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary + '50' }}
          thumbColor={value ? theme.primary : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const StepListingInfo = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Pricing</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Set your listing type and price.
      </AppText>

      <View style={{ gap: 12, marginBottom: 24 }}>
        <ToggleCard
          label="For Sale"
          description="List this property for purchase"
          icon="tag-outline"
          value={values.for_sale}
          onValueChange={(val: boolean) => {
            setFieldValue('for_sale', val);
            if (!val) setFieldValue('sale_price', '');
          }}
        />

        {values.for_sale && (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={smoothLayout}>
            <AnimatedFormInput
              label="Sale Price"
              placeholder="0.00"
              keyboardType="numeric"
              value={values.sale_price?.toString()}
              onChangeText={(t) => setFieldValue('sale_price', t)}
              error={errors.sale_price as string}
              touched={touched.sale_price}
              icon={<MaterialCommunityIcons name="currency-usd" size={22} color={theme.subtext} />}
              containerStyle={{ marginTop: 0 }}
            />
          </Animated.View>
        )}

        <ToggleCard
          label="For Rent"
          description="List this property for monthly rent"
          icon="calendar-clock-outline"
          value={values.for_rent}
          onValueChange={(val: boolean) => {
            setFieldValue('for_rent', val);
            if (!val) setFieldValue('rent_price', '');
          }}
        />

        {values.for_rent && (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={smoothLayout}>
            <AnimatedFormInput
              label="Monthly Rent"
              placeholder="0.00"
              keyboardType="numeric"
              value={values.rent_price?.toString()}
              onChangeText={(t) => setFieldValue('rent_price', t)}
              error={errors.rent_price as string}
              touched={touched.rent_price}
              icon={<MaterialCommunityIcons name="currency-usd" size={22} color={theme.subtext} />}
              containerStyle={{ marginTop: 0 }}
            />
          </Animated.View>
        )}
      </View>

      {!values.for_sale && !values.for_rent && (
        <View style={[styles.warningBox, { backgroundColor: theme.warning + '10', borderColor: theme.warning + '30' }]}>
          <Ionicons name="warning-outline" size={20} color={theme.warning} />
          <AppText variant="caption" weight="medium" style={{ color: theme.warning, flex: 1, marginLeft: 8 }}>
            Please select at least one listing type to make the property visible to seekers.
          </AppText>
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
    marginBottom: 24,
    marginTop: 2,
  },
  toggleCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInputContainer: {
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
});

export default StepListingInfo;
