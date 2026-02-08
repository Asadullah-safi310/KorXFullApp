import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal, ScrollView, RefreshControl, PanResponder } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import propertyStore from '../../../stores/PropertyStore';
import authStore from '../../../stores/AuthStore';
import PropertyCard from '../../../components/PropertyCard';
import { personService } from '../../../services/person.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor, useCurrentTheme } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { BlurView } from 'expo-blur';

const PriceRangeSlider = ({ min, max, onValueChange, themeColors }: any) => {
  const [width, setWidth] = useState(0);
  const [pageX, setPageX] = useState(0);
  const viewRef = useRef<View>(null);
  
  const minVal = parseFloat(min) || 0;
  const maxVal = parseFloat(max) || 2000000;
  const RANGE_MAX = 2000000;
  
  const histogramData = [5, 8, 12, 18, 25, 40, 35, 45, 60, 55, 40, 30, 25, 18, 12, 8, 5, 3, 2, 1];

  const getPosFromValue = (value: number) => {
    if (width === 0) return 0;
    return (value / RANGE_MAX) * width;
  };

  const getValueFromPos = useCallback((pos: number) => {
    return Math.round((pos / width) * RANGE_MAX);
  }, [width]);

  const leftPos = getPosFromValue(minVal);
  const rightPos = getPosFromValue(maxVal);

  const panResponderLeft = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.max(0, Math.min(gestureState.moveX - pageX, rightPos - 20));
      onValueChange(getValueFromPos(newPos), maxVal);
    },
  }), [pageX, rightPos, maxVal, onValueChange, getValueFromPos]);

  const panResponderRight = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.min(width, Math.max(leftPos + 20, gestureState.moveX - pageX));
      onValueChange(minVal, getValueFromPos(newPos));
    },
  }), [width, pageX, leftPos, minVal, onValueChange, getValueFromPos]);

  const onLayout = () => {
    viewRef.current?.measure((x, y, w, h, px, py) => {
      setWidth(w);
      setPageX(px);
    });
  };

  const formatCurrency = (val: number) => {
    return '$' + val.toLocaleString();
  };

  return (
    <View 
      ref={viewRef}
      style={styles.sliderWrapper} 
      onLayout={onLayout}
    >
      <View style={styles.histogramContainer}>
        {histogramData.map((h, i) => {
          const barPos = (i / histogramData.length) * width;
          const isActive = barPos >= leftPos && barPos <= rightPos;
          return (
            <View 
              key={i} 
              style={[
                styles.histogramBar, 
                { height: h, backgroundColor: isActive ? themeColors.primary + '30' : themeColors.border }
              ]} 
            />
          );
        })}
      </View>

      <View style={[styles.sliderTrackBase, { backgroundColor: themeColors.border }]}>
        <View 
          style={[
            styles.sliderTrackHighlight, 
            { 
              left: leftPos, 
              width: rightPos - leftPos, 
              backgroundColor: themeColors.primary 
            }
          ]} 
        />
      </View>

      <View 
        style={[styles.sliderThumbHitArea, { left: leftPos - 20 }]} 
        {...panResponderLeft.panHandlers}
      >
        <View style={[styles.sliderThumb, { borderColor: themeColors.primary, backgroundColor: themeColors.background }]} />
      </View>
      <View 
        style={[styles.sliderThumbHitArea, { left: rightPos - 20 }]} 
        {...panResponderRight.panHandlers}
      >
        <View style={[styles.sliderThumb, { borderColor: themeColors.primary, backgroundColor: themeColors.background }]} />
      </View>

      <View style={styles.sliderLabels}>
        <Text style={[styles.priceLabelValue, { color: themeColors.text }]}>{formatCurrency(minVal)}</Text>
        <Text style={[styles.priceLabelValue, { color: themeColors.text }]}>{formatCurrency(maxVal)}</Text>
      </View>
    </View>
  );
};

const PropertiesScreen = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const themeColors = useThemeColor();
  const currentTheme = useCurrentTheme();
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  const [agents, setAgents] = useState([]);
  const [viewMode, setViewMode] = useState<'default' | 'horizontal'>('default');
  
  const [filters, setFilters] = useState({
    city: (params.city as string) || '',
    province_id: (params.province_id as string) || '',
    district_id: (params.district_id as string) || '',
    area_id: (params.area_id as string) || '',
    province_name: (params.province_name as string) || '',
    district_name: (params.district_name as string) || '',
    area_name: (params.area_name as string) || '',
    property_type: '',
    record_kind: '',
    property_category: '',
    purpose: params.type === 'Rent/PG' ? 'rent' : params.type === 'Buy' ? 'sale' : '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    agent_id: '',
  });

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters, showFilters]);

  const updateTempFilter = (name: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  useEffect(() => {
    if (params.province_id || params.district_id || params.area_id || params.type || params.city) {
      setFilters(prev => ({
        ...prev,
        province_id: (params.province_id as string) || '',
        district_id: (params.district_id as string) || '',
        area_id: (params.area_id as string) || '',
        province_name: (params.province_name as string) || '',
        district_name: (params.district_name as string) || '',
        area_name: (params.area_name as string) || '',
        city: (params.city as string) || '',
        purpose: params.type === 'Rent/PG' ? 'rent' : params.type === 'Buy' ? 'sale' : '',
      }));
    }
  }, [params.province_id, params.district_id, params.area_id, params.type, params.province_name, params.district_name, params.area_name, params.city]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await personService.getAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents', error);
    }
  }, []);

  const handleSearch = useCallback(async (isLoadMoreArg = false) => {
    const isLoadMore = isLoadMoreArg === true;
    setShowFilters(false);
    try {
      const queryParams: any = { ...filters };
      
      if (filters.min_price) {
        if (filters.purpose === 'rent') queryParams.min_rent_price = filters.min_price;
        else queryParams.min_sale_price = filters.min_price;
        delete queryParams.min_price;
      }
      if (filters.max_price) {
        if (filters.purpose === 'rent') queryParams.max_rent_price = filters.max_price;
        else queryParams.max_sale_price = filters.max_price;
        delete queryParams.max_price;
      }

      queryParams.status = 'active';

      delete queryParams.province_name;
      delete queryParams.district_name;
      delete queryParams.area_name;

      const cleanFilters = Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      
      await propertyStore.searchProperties(cleanFilters, isLoadMore);
    } catch (error) {
      console.error('Search failed', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchAgents();
    handleSearch();
  }, [fetchAgents, handleSearch]);

  const onRefresh = () => {
    handleSearch();
  };

  const loadMore = () => {
    if (propertyStore.hasMore && !propertyStore.loadingMore) {
      handleSearch(true);
    }
  };

  const renderFooter = () => {
    if (!propertyStore.loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.primary} />
      </View>
    );
  };

  const updateFilter = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      province_id: '',
      district_id: '',
      area_id: '',
      province_name: '',
      district_name: '',
      area_name: '',
      property_type: '',
      record_kind: '',
      property_category: '',
      purpose: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      agent_id: '',
    });
    router.setParams({
      province_id: '',
      district_id: '',
      area_id: '',
      province_name: '',
      district_name: '',
      area_name: '',
      type: ''
    });
  };

  return (
    <ScreenLayout
      backgroundColor={themeColors.background}
      bottomSpacing={0}
      edges={['left', 'right']}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 20 }}>
        <Text style={[styles.premiumPageTitle, { color: themeColors.text }]}>Explore{"\n"}Properties</Text>
      </View>

      {propertyStore.error && (
        <View style={[styles.errorBox, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '20' }]}>
          <Text style={[styles.errorText, { color: themeColors.danger }]}>{propertyStore.error}</Text>
          <TouchableOpacity onPress={() => handleSearch()}>
            <Text style={{ color: themeColors.primary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {propertyStore.loading && propertyStore.properties.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={propertyStore.properties}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={[styles.premiumSearchHeader, { paddingHorizontal: 0 }]}>
                <TouchableOpacity 
                  style={[styles.premiumSearchBar, { backgroundColor: '#fff', borderColor: '#e0e0e0' }]}
                  activeOpacity={0.9}
                  onPress={() => router.push('/search')}
                >
                  <Ionicons name="search-outline" size={18} color="#999" />
                  <Text style={[styles.premiumSearchText, { color: '#999' }]} numberOfLines={1}>
                    {filters.area_name ? (
                      `${filters.province_name} > ${filters.district_name} > ${filters.area_name}`
                    ) : filters.district_name ? (
                      `${filters.province_name} > ${filters.district_name}`
                    ) : filters.province_name ? (
                      filters.province_name
                    ) : filters.city ? (
                      filters.city
                    ) : 'Search location, property...'}
                  </Text>
                  {(filters.city || filters.province_name || filters.district_name || filters.area_name) && (
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        clearFilters();
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.premiumFilterBtn, { backgroundColor: themeColors.primary }]} 
                  onPress={() => setShowFilters(true)}
                >
                  <Text style={styles.filterBtnText}>Filters</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.viewToggleBtn, { backgroundColor: '#fff', borderColor: '#e0e0e0' }]} 
                  onPress={() => {
                    const newMode = viewMode === 'default' ? 'horizontal' : 'default';
                    setViewMode(newMode);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={viewMode === 'default' ? 'list-outline' : 'grid-outline'} 
                    size={22} 
                    color={themeColors.text} 
                  />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.premiumCategoryScroll}
                contentContainerStyle={styles.premiumCategoryContainer}
              >
                {[
                  { name: 'All', type: 'all', icon: 'apps' },
                  { name: 'Home', type: 'property_type', value: 'house', icon: 'home-variant-outline' },
                  { name: 'Apartment', type: 'property_type', value: 'apartment', icon: 'office-building-outline' },
                  { name: 'Land', type: 'property_type', value: 'land', icon: 'map-outline' },
                  { name: 'Shop', type: 'property_type', value: 'shop', icon: 'store-outline' },
                  { name: 'Towers', type: 'property_category', value: 'tower', icon: 'city-variant-outline' },
                  { name: 'Markets', type: 'property_category', value: 'market', icon: 'store' },
                  { name: 'Sharaks', type: 'property_category', value: 'sharak', icon: 'home-group' },
                ].map((cat) => {
                  let isActive = false;
                  if (cat.type === 'all') {
                    isActive = !filters.property_type && !filters.property_category;
                  } else if (cat.type === 'property_type') {
                    isActive = filters.property_type === cat.value;
                  } else if (cat.type === 'property_category') {
                    isActive = filters.property_category === cat.value;
                  }

                  return (
                    <TouchableOpacity 
                      key={cat.name} 
                      onPress={() => {
                        if (cat.type === 'all') {
                          setFilters(prev => ({ 
                            ...prev, 
                            property_type: '', 
                            record_kind: '', 
                            property_category: '',
                            purpose: '' // Clear purpose when showing all
                          }));
                        } else if (cat.type === 'property_type') {
                          setFilters(prev => ({ 
                            ...prev, 
                            property_type: isActive ? '' : cat.value, 
                            record_kind: '', 
                            property_category: '' 
                          }));
                        } else if (cat.type === 'property_category') {
                          setFilters(prev => ({ 
                            ...prev, 
                            property_type: '', 
                            record_kind: isActive ? '' : 'container', 
                            property_category: isActive ? '' : cat.value,
                            purpose: '' // Clear purpose for containers as they don't have one
                          }));
                        }
                      }}
                      style={[
                        styles.premiumCategoryChip, 
                        { backgroundColor: '#fff' },
                        isActive && { backgroundColor: themeColors.primary }
                      ]}
                    >
                      <MaterialCommunityIcons 
                        name={cat.icon as any} 
                        size={18} 
                        color={isActive ? '#fff' : themeColors.subtext} 
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[
                        styles.premiumCategoryText, 
                        { color: isActive ? '#fff' : themeColors.text }
                      ]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <PropertyCard
                property={item}
                index={index}
                variant={viewMode}
                onPress={() => {
                  if (item.record_kind === 'container') {
                    // Navigate to parent profile page based on category
                    const category = item.property_category || 'tower';
                    router.push(`/parent/${category}/${item.property_id}`);
                  } else {
                    router.push(`/property/${item.property_id}`);
                  }
                }}
              />
            </View>
          )}
          keyExtractor={(item, index) => (item?.property_id ? `${item.property_id}-${index}` : `idx-${index}`)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={propertyStore.refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.card }]}>
                <Ionicons name="search-outline" size={40} color={themeColors.subtext} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      {authStore.isAuthenticated && (
        <TouchableOpacity 
          style={[styles.premiumFab, { backgroundColor: themeColors.primary }]}
          onPress={() => router.push('/property/create')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={false}>
        <ScreenLayout backgroundColor={themeColors.background}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={[styles.closeBtn, { backgroundColor: themeColors.card }]}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Filters</Text>
            <TouchableOpacity onPress={() => {
              setTempFilters({
                ...tempFilters,
                property_type: '',
                property_category: '',
                purpose: '',
                min_price: '',
                max_price: '',
                bedrooms: '',
                agent_id: '',
              });
            }}>
              <Text style={[styles.resetText, { color: themeColors.primary }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Property Type</Text>
              <View style={styles.chipGrid}>
                {['House', 'Apartment', 'Land', 'Shop', 'Office'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip, 
                      { backgroundColor: themeColors.card },
                      tempFilters.property_type === type && { backgroundColor: themeColors.primary }
                    ]}
                    onPress={() => updateTempFilter('property_type', tempFilters.property_type === type ? '' : type)}
                  >
                    <Text style={[
                      styles.filterChipText, 
                      { color: themeColors.text },
                      tempFilters.property_type === type && { color: '#fff' }
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Building Categories</Text>
              <View style={styles.chipGrid}>
                {[
                  { label: 'Towers', value: 'tower' },
                  { label: 'Markets', value: 'market' },
                  { label: 'Sharaks', value: 'sharak' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.filterChip, 
                      { backgroundColor: themeColors.card },
                      tempFilters.property_category === item.value && { backgroundColor: themeColors.primary }
                    ]}
                    onPress={() => updateTempFilter('property_category', tempFilters.property_category === item.value ? '' : item.value)}
                  >
                    <Text style={[
                      styles.filterChipText, 
                      { color: themeColors.text },
                      tempFilters.property_category === item.value && { color: '#fff' }
                    ]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Purpose</Text>
              <View style={styles.chipGrid}>
                {[
                  { label: 'For Sale', value: 'SALE' },
                  { label: 'For Rent', value: 'RENT' },
                  { label: 'Both', value: 'BOTH' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.filterChip, 
                      { backgroundColor: themeColors.card },
                      tempFilters.purpose === item.value && { backgroundColor: themeColors.primary }
                    ]}
                    onPress={() => updateTempFilter('purpose', tempFilters.purpose === item.value ? '' : item.value)}
                  >
                    <Text style={[
                      styles.filterChipText, 
                      { color: themeColors.text },
                      tempFilters.purpose === item.value && { color: '#fff' }
                    ]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Price Range</Text>
              <PriceRangeSlider 
                min={tempFilters.min_price} 
                max={tempFilters.max_price || 2000000} 
                themeColors={themeColors}
                onValueChange={(minVal: number, maxVal: number) => {
                  setTempFilters(prev => ({ ...prev, min_price: String(minVal), max_price: String(maxVal) }));
                }}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Bedrooms</Text>
              <View style={styles.chipGrid}>
                {['1', '2', '3', '4', '5+'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.filterChip, 
                      { backgroundColor: themeColors.card },
                      tempFilters.bedrooms === num.replace('+', '') && { backgroundColor: themeColors.primary }
                    ]}
                    onPress={() => updateTempFilter('bedrooms', tempFilters.bedrooms === num.replace('+', '') ? '' : num.replace('+', ''))}
                  >
                    <Text style={[
                      styles.filterChipText, 
                      { color: themeColors.text },
                      tempFilters.bedrooms === num.replace('+', '') && { color: '#fff' }
                    ]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {agents.filter((agent: any) => agent.role !== 'admin').length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: themeColors.text }]}>Agent</Text>
                <View style={styles.chipGrid}>
                  {agents.filter((agent: any) => agent.role !== 'admin').map((agent: any) => (
                    <TouchableOpacity
                      key={agent.user_id}
                      style={[
                        styles.filterChip, 
                        { backgroundColor: themeColors.card },
                        tempFilters.agent_id === String(agent.user_id) && { backgroundColor: themeColors.primary }
                      ]}
                      onPress={() => updateTempFilter('agent_id', tempFilters.agent_id === String(agent.user_id) ? '' : String(agent.user_id))}
                    >
                      <Text style={[
                        styles.filterChipText, 
                        { color: themeColors.text },
                        tempFilters.agent_id === String(agent.user_id) && { color: '#fff' }
                      ]}>{agent.full_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

          <BlurView intensity={80} tint={currentTheme === 'dark' ? 'dark' : 'light'} style={styles.modalFooterBlur}>
            <TouchableOpacity style={[styles.premiumApplyBtn, { backgroundColor: themeColors.primary }]} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </BlurView>
        </ScreenLayout>
      </Modal>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  premiumSearchHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  premiumSearchBar: {
    flex: 1,
    height: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  premiumSearchText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  premiumFilterBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  viewToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  center: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    paddingHorizontal: 20,
  },
  premiumPageTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 10,
  },
  premiumCategoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  premiumCategoryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 40,
  },
  premiumCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 0,
  },
  premiumCategoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  premiumFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sliderWrapper: {
    height: 100,
    justifyContent: 'center',
  },
  histogramContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: 10,
  },
  histogramBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  sliderTrackBase: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderTrackHighlight: {
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
  },
  sliderThumbHitArea: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    zIndex: 10,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  priceLabelValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalFooterBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  premiumApplyBtn: {
    height: 56,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default PropertiesScreen;
