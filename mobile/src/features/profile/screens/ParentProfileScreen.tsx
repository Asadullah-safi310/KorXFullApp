import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  RefreshControl,
  FlatList,
  Alert
} from 'react-native';
import { AppText } from '../../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useThemeColor } from '../../../hooks/useThemeColor';
import parentStore from '../../../stores/ParentStore';
import authStore from '../../../stores/AuthStore';
import PropertyCard from '../../../components/PropertyCard';
import { getImageUrl } from '../../../utils/mediaUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import ScreenLayout from '../../../components/ScreenLayout';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 350;

const ParentProfileScreen = observer(() => {
  const { category, id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeColor();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'units'>('features');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const parentId = Number(id);

  const fetchData = useCallback(async () => {
    if (!parentId) return;
    try {
      await Promise.all([
        parentStore.fetchParentById(parentId),
        parentStore.fetchChildren(parentId)
      ]);
    } catch (error) {
      console.error('Error fetching parent details:', error);
    }
  }, [parentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getAddUnitText = () => {
    switch (category?.toLowerCase()) {
      case 'market': return 'Add Shop/Office';
      case 'sharak': return 'Add Apartment/Shop/Office/Land/Plot/House';
      case 'tower': 
      case 'apartment': return 'Add Apartment/Shop/Office';
      default: return 'Add Unit';
    }
  };

  const getFilterTypes = () => {
    switch (category?.toLowerCase()) {
      case 'market': return ['ALL', 'SHOP', 'OFFICE'];
      case 'sharak': return ['ALL', 'APARTMENT', 'SHOP', 'OFFICE', 'LAND', 'HOUSE'];
      case 'tower': 
      case 'apartment': return ['ALL', 'APARTMENT', 'SHOP', 'OFFICE'];
      default: return ['ALL'];
    }
  };

  if (parentStore.loading && !parentStore.currentParent) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const parent = parentStore.currentParent;
  const units = parentStore.children;

  const filteredUnits = selectedType === 'ALL' 
    ? units 
    : units.filter(u => u.property_type?.toUpperCase() === selectedType.toUpperCase());

  if (!parent) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <AppText variant="body" color={theme.text}>Property not found</AppText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <AppText variant="body" color={theme.primary}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = authStore.user?.user_id === parent.created_by_user_id || authStore.isAdmin;

  const renderFacility = (key: string, label: string, icon: string, provider: 'Ionicons' | 'MaterialCommunityIcons' = 'Ionicons') => {
    if (!parent.facilities?.[key]) return null;
    return (
      <View style={[styles.facilityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {provider === 'Ionicons' ? (
          <Ionicons name={icon as any} size={20} color={theme.primary} />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={20} color={theme.primary} />
        )}
        <AppText variant="caption" color={theme.text} style={{ marginTop: 4 }}>{label}</AppText>
      </View>
    );
  };

  const images = parent.photos || [];

  return (
    <ScreenLayout backgroundColor={theme.background} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Image 
                  source={{ uri: getImageUrl(item) }} 
                  style={styles.headerImage} 
                  contentFit="cover" 
                />
              )}
            />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name={
                  category?.toLowerCase() === 'market' ? 'storefront' : 
                  category?.toLowerCase() === 'sharak' ? 'account-group' : 
                  'office-building'
                } 
                size={80} color={theme.border} 
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {isOwner && (
            <View style={[styles.headerActions, { top: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => router.push({
                  pathname: `/parent/${category}/edit`,
                  params: { id: parent.id }
                })}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <AppText variant="h2" weight="bold" color={theme.text}>{parent.title}</AppText>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={theme.primary} />
              <AppText variant="body" color={theme.subtext} style={{ marginLeft: 4 }}>
                {parent.address}, {parent.DistrictData?.name}, {parent.ProvinceData?.name}
              </AppText>
            </View>
          </View>

          <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'features' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('features')}
            >
              <AppText 
                variant="body" 
                weight={activeTab === 'features' ? "bold" : "regular"}
                color={activeTab === 'features' ? theme.primary : theme.subtext}
              >
                Features
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'units' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('units')}
            >
              <AppText 
                variant="body" 
                weight={activeTab === 'units' ? "bold" : "regular"}
                color={activeTab === 'units' ? theme.primary : theme.subtext}
              >
                Units ({units.length})
              </AppText>
            </TouchableOpacity>
          </View>

          {activeTab === 'features' ? (
            <>
              <View style={styles.section}>
                <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>About</AppText>
                <AppText variant="body" color={theme.text} style={styles.description}>
                  {parent.description || 'No description available.'}
                </AppText>
              </View>

              {parent.facilities && (
                <View style={styles.section}>
                  <AppText variant="h3" weight="bold" color={theme.text} style={styles.sectionTitle}>Facilities</AppText>
                  <View style={styles.facilitiesGrid}>
                    {renderFacility('lift', 'Lift', 'elevator-passenger-outline', 'MaterialCommunityIcons')}
                    {renderFacility('parking', 'Parking', 'car-outline')}
                    {renderFacility('generator', 'Generator', 'engine-outline', 'MaterialCommunityIcons')}
                    {renderFacility('security', 'Security', 'shield-checkmark-outline')}
                    {renderFacility('solar', 'Solar', 'solar-power-variant-outline', 'MaterialCommunityIcons')}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.unitsHeader}>
                <AppText variant="h3" weight="bold" color={theme.text}>Units</AppText>
                {isOwner && (
                  <TouchableOpacity 
                    style={[styles.addUnitBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push({
                      pathname: '/property/create',
                      params: { parentId: parent.property_id || parent.id, category: parent.property_category }
                    })}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <AppText variant="caption" weight="bold" color="#fff">{getAddUnitText()}</AppText>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {getFilterTypes().map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      selectedType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <AppText 
                      variant="tiny" 
                      weight="bold" 
                      color={selectedType === type ? "#fff" : theme.subtext}
                    >
                      {type}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredUnits.length > 0 ? (
                <View style={styles.unitsList}>
                  {filteredUnits.map((unit, index) => (
                    <PropertyCard 
                      key={unit.property_id} 
                      property={unit} 
                      index={index}
                      onPress={() => router.push(`/property/${unit.property_id}`)}
                    />
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyUnits, { backgroundColor: theme.card }]}>
                  <Ionicons name="home-outline" size={40} color={theme.border} />
                  <AppText variant="body" color={theme.subtext} style={{ marginTop: 10 }}>
                    No units listed yet.
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: HEADER_HEIGHT, width: width, position: 'relative' },
  headerImage: { width: width, height: HEADER_HEIGHT },
  backButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { position: 'absolute', right: 20, flexDirection: 'row', gap: 10 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, backgroundColor: 'white', minHeight: 500 },
  headerInfo: { marginBottom: 24 },
  titleRow: { marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  description: { lineHeight: 22 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  facilityItem: { width: (width - 64) / 3, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  unitsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addUnitBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  unitsList: { gap: 16 },
  emptyUnits: { padding: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ddd' },
  filterScroll: { marginBottom: 16 },
  filterContent: { gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 }
});

export default ParentProfileScreen;
