import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { getImageUrl } from '../utils/mediaUtils';
import authStore from '../stores/AuthStore';
import favoriteStore from '../stores/FavoriteStore';
import { shareProperty } from '../utils/shareUtils';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  FadeInDown
} from 'react-native-reanimated';
import { 
  springConfig, 
  pressFeedbackScale, 
  heartBounceScale 
} from '../utils/animations';

import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DefaultPropertyImage = require('../../assets/images/property.jpg');

interface PropertyCardProps {
  property: any;
  onPress: () => void;
  index?: number;
  variant?: 'default' | 'compact';
}

const PropertyCard = observer(({ property, onPress, index = 0, variant = 'default' }: PropertyCardProps) => {
  const themeColors = useThemeColor();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  
  const isFavorite = favoriteStore.isFavorite(property.property_id);
  const heartScale = useSharedValue(1);
  const cardScale = useSharedValue(1);
  
  const toggleFavorite = (e: any) => {
    e.stopPropagation();
    if (!authStore.isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Heart bounce animation
    heartScale.value = withSequence(
      withSpring(1.3, springConfig),
      withSpring(1, springConfig)
    );
    
    favoriteStore.toggleFavorite(property.property_id);
  };
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, springConfig);
  };

  const photos = (property.photos && property.photos.length > 0) 
    ? property.photos 
    : (property.images && property.images.length > 0)
      ? property.images
      : [];
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    if (viewSize > 0) {
      const index = Math.round(contentOffset / viewSize);
      setActiveIndex(index);
    }
  };

  const formatPrice = (price: any, currency: string = 'AF') => {
    if (!price) return '-';
    const num = parseFloat(price);
    const symbol = currency === 'USD' ? '$' : 'AF';
    
    if (currency === 'USD') {
      return `$${num.toLocaleString()}`;
    }

    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr ${symbol}`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} Lac ${symbol}`;
    return `${num.toLocaleString()} ${symbol}`;
  };

  const getPropertyDisplayPrice = (property: any) => {
    const purpose = property.purpose?.toUpperCase();
    if (purpose === 'SALE' || purpose === 'BOTH' || (isSale && !isRent)) {
      return property.sale_price ? formatPrice(property.sale_price, property.sale_currency) : 'Price on Request';
    }
    return property.rent_price ? `${formatPrice(property.rent_price, property.rent_currency)} / mo` : 'Price on Request';
  };

  const isContainer = property.record_kind === 'container';
  const displayPrice = isContainer 
    ? (property.property_category ? property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : 'Building')
    : getPropertyDisplayPrice(property);
  
  const isSale = !!property.forSale || !!property.is_available_for_sale || !!property.for_sale || !!property.isAvailableForSale || property.purpose?.toLowerCase() === 'sale' || property.purpose?.toLowerCase() === 'both';
  const isRent = !!property.forRent || !!property.is_available_for_rent || !!property.for_rent || !!property.isAvailableForRent || property.purpose?.toLowerCase() === 'rent' || property.purpose?.toLowerCase() === 'both';
  const isPubliclyAvailable = isSale || isRent;
  
  let propertyTitle = property.title || property.property_type || 'Modern Living Space';
  if (property.parent_property_id) {
    if (property.unit_number && property.floor) {
      propertyTitle = `${property.property_type} ${property.unit_number} (Floor ${property.floor})`;
    } else if (property.unit_number) {
      propertyTitle = `${property.property_type} ${property.unit_number}`;
    }
  } else if (isContainer) {
    propertyTitle = property.title || `${property.property_category ? property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1) : 'Building'}`;
  }

  const addressParts: string[] = [];
  const areaName = property.AreaData?.name || property.area?.name || property.area_name;
  const cityName = property.ProvinceData?.name || property.province?.name || property.city || property.province_name;

  if (areaName) {
    let cleanedArea = areaName.replace(/(District|Nahiya)\s+\d+/gi, '').trim();
    cleanedArea = cleanedArea.replace(/^[\s,]+|[\s,]+$/g, '').trim();
    if (cleanedArea) addressParts.push(cleanedArea);
  } else if (property.address || property.location) {
    let addr = (property.address || property.location);
    let cleanedAddr = addr.replace(/(District|Nahiya)\s+\d+/gi, '').trim();
    cleanedAddr = cleanedAddr.replace(/^[\s,]+|[\s,]+$/g, '').trim();
    if (cleanedAddr) addressParts.push(cleanedAddr.split(',')[0].trim());
  }

  if (cityName) {
    addressParts.push(cityName);
  }
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Location not specified';

  const renderImageItem = ({ item }: { item: string }) => (
    <Pressable 
      onPress={onPress}
      style={variant === 'compact' ? styles.compactImageContainer : styles.imageContainer}
    >
      <Image 
        source={{ uri: getImageUrl(item) || undefined }} 
        style={variant === 'compact' ? styles.compactImage : styles.image} 
        contentFit="cover"
        transition={300}
      />
    </Pressable>
  );

  const PaginationDots = ({ length, active }: { length: number; active: number }) => {
    if (length <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {Array.from({ length: Math.min(length, 6) }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: i === active ? themeColors.white : 'rgba(255,255,255,0.4)' },
                i === active && { width: 14, backgroundColor: themeColors.white }
              ]} 
            />
          ))}
        </View>
        <View style={styles.countBadge}>
          <AppText variant="tiny" weight="bold" color={themeColors.white}>
            {active + 1}/{length}
          </AppText>
        </View>
      </View>
    );
  };

  if (variant === 'compact') {
    const displayPrice = getPropertyDisplayPrice(property);
    const locationLabel = property.location || property.city || 'Your Property';
    const typeLabel = property.property_type || 'Property';
    const bedLabel = property.bedrooms ?? '-';
    const areaLabel = property.area_size ?? '-';

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View 
          entering={FadeInDown.delay(index * 100).duration(500)}
          style={[cardAnimatedStyle]}
        >
          <View 
            style={[styles.compactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          >
            <View style={styles.compactMedia}>
              {photos.length > 0 ? (
                <FlatList
                  data={photos}
                  renderItem={renderImageItem}
                  keyExtractor={(item, idx) => `compact-${idx}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  style={styles.compactFlatList}
                  nestedScrollEnabled={true}
                />
              ) : (
                <View>
                  <Image source={DefaultPropertyImage} style={styles.compactImage} contentFit="cover" />
                </View>
              )}
              
              <View style={styles.compactImageOverlay} />
              
              {isPubliclyAvailable && (
                <View style={[styles.availabilityDotAbsolute, { backgroundColor: themeColors.success, top: 12, left: 12, right: 'auto' }]} />
              )}

              <View style={[styles.compactBadgeRow, { left: 34 }]}>
                {isSale && (
                  <View style={[styles.compactTag, { backgroundColor: themeColors.primary }]}> 
                    <AppText variant="tiny" weight="bold" color={themeColors.white}>Sale</AppText>
                  </View>
                )}
                {isRent && (
                  <View style={[styles.compactTag, { backgroundColor: themeColors.success }]}> 
                    <AppText variant="tiny" weight="bold" color={themeColors.white}>Rent</AppText>
                  </View>
                )}
              </View>
              
              <PaginationDots length={photos.length} active={activeIndex} />

              <TouchableOpacity 
                style={[styles.compactFavorite, { top: 12, right: 52, backgroundColor: 'rgba(255,255,255,0.9)' }]} 
                onPress={(e) => {
                  e.stopPropagation();
                  shareProperty(property);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={18} color={themeColors.text} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.compactFavorite, { top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)' }]} 
                onPress={toggleFavorite}
                activeOpacity={0.7}
              >
                <Animated.View style={heartAnimatedStyle}>
                  <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? themeColors.danger : themeColors.text} />
                </Animated.View>
              </TouchableOpacity>
            </View>

            <View style={styles.compactBody}>
              <View style={styles.compactHeaderRow}>
                <AppText variant="small" weight="bold" numberOfLines={1} style={{ flex: 1, marginRight: 10 }}>
                  {property.parent_property_id && property.unit_number ? `Unit ${property.unit_number}` : locationLabel}
                </AppText>
                <View style={[styles.compactTypeBadge, { backgroundColor: themeColors.background }]}> 
                  <AppText variant="tiny" weight="bold" color={themeColors.subtext} numberOfLines={1}>
                    {typeLabel}
                  </AppText>
                </View>
              </View>
              <AppText variant="small" weight="bold" color={themeColors.primary} numberOfLines={1} style={{ marginBottom: 8 }}>
                {displayPrice}
              </AppText>
              <View style={styles.compactMetaRow}>
                {isContainer ? (
                  <View style={styles.compactMetaItem}>
                    <Ionicons name="business-outline" size={14} color={themeColors.subtext} />
                    <AppText variant="tiny" weight="medium">{property.total_children || 0} Units</AppText>
                  </View>
                ) : (
                  <>
                    <View style={styles.compactMetaItem}>
                      <Ionicons name="bed-outline" size={14} color={themeColors.subtext} />
                      <AppText variant="tiny" weight="medium">{bedLabel} BHK</AppText>
                    </View>
                    <View style={[styles.compactSeparator, { backgroundColor: themeColors.border }]} />
                    <View style={styles.compactMetaItem}>
                      <MaterialCommunityIcons name="vector-square" size={14} color={themeColors.subtext} />
                      <AppText variant="tiny" weight="medium">{areaLabel} sqft</AppText>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={[cardAnimatedStyle]}
      >
        <View 
          style={[
            styles.container, 
            { 
              backgroundColor: themeColors.card, 
              borderColor: themeColors.border,
              borderWidth: 1,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 20,
            }
          ]}
        >
          {/* Image Section */}
          <View style={styles.imageWrapper}>
            {photos.length > 0 ? (
              <FlatList
                data={photos}
                renderItem={renderImageItem}
                keyExtractor={(item, idx) => `default-${idx}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.flatList}
                nestedScrollEnabled={true}
              />
            ) : (
              <View>
                <Image source={DefaultPropertyImage} style={styles.image} contentFit="cover" />
              </View>
            )}

            {isPubliclyAvailable && (
              <View style={[styles.availabilityDotAbsolute, { backgroundColor: themeColors.success, top: 12, left: 12, right: 'auto' }]} />
            )}

            <PaginationDots length={photos.length} active={activeIndex} />
            
            <View style={[styles.badgeRow, { top: 12, left: 34 }]}>
              {isSale && (
                <View style={[styles.statusTag, { backgroundColor: themeColors.primary }]}> 
                  <AppText variant="tiny" weight="bold" color={themeColors.white}>Sale</AppText>
                </View>
              )}
              {isRent && (
                <View style={[styles.statusTag, { backgroundColor: themeColors.success }]}> 
                  <AppText variant="tiny" weight="bold" color={themeColors.white}>Rent</AppText>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.favoriteBtn, { top: 12, right: 56, backgroundColor: 'rgba(255,255,255,0.9)' }]}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                shareProperty(property);
              }}
            >
              <Ionicons name="share-social-outline" size={18} color={themeColors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.favoriteBtn, { top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)' }]}
              activeOpacity={0.8}
              onPress={toggleFavorite}
            >
              <Animated.View style={heartAnimatedStyle}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? themeColors.danger : themeColors.text} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <AppText variant="small" weight="bold" numberOfLines={1} color={isContainer ? themeColors.text : themeColors.primary}> 
                  {displayPrice}
                  {!isContainer && (
                    <AppText variant="tiny" color={themeColors.mutedText}> / {isRent && !isSale ? 'mo' : 'yr'}</AppText>
                  )}
                </AppText>
              </View>
              <View style={[styles.ratingContainer, { backgroundColor: themeColors.warningSubtle }]}>
                <Ionicons name="star" size={14} color={themeColors.warning} />
                <AppText variant="caption" weight="bold" style={{ marginLeft: 4, color: themeColors.warningText }}>4.0</AppText>
              </View>
            </View>

            <View style={styles.titleRow}>
              <AppText variant="tiny" weight="bold" numberOfLines={1} style={{ flex: 1, marginRight: 12 }}>
                {propertyTitle}
              </AppText>
            
              <View style={styles.featureRow}>
                {isContainer ? (
                  <View style={styles.featureItem}>
                    <Ionicons name="business-outline" size={16} color={themeColors.mutedText} />
                    <AppText variant="small" weight="medium" style={{ marginLeft: 4 }}>{property.total_children || 0} Units</AppText>
                  </View>
                ) : (
                  <>
                    <View style={styles.featureItem}>
                      <Ionicons name="bed-outline" size={16} color={themeColors.mutedText} />
                      <AppText variant="small" weight="medium" style={{ marginLeft: 4 }}>{property.bedrooms || 0}</AppText>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="bathtub-outline" size={16} color={themeColors.mutedText} />
                      <AppText variant="small" weight="medium" style={{ marginLeft: 4 }}>{property.bathrooms || 0}</AppText>
                    </View>
                  </>
                )}
              </View>
            </View>
          
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={themeColors.mutedText} />
              <AppText variant="tiny" color={themeColors.mutedText} numberOfLines={1} style={{ flex: 1, fontSize: 10 }}>
                {fullAddress || 'Location details'}
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  compactCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    width: SCREEN_WIDTH - 40,
  },
  compactMedia: {
    height: 190,
    width: '100%',
    position: 'relative',
  },
  compactFlatList: {
    width: '100%',
    height: '100%',
  },
  compactImageContainer: {
    width: SCREEN_WIDTH - 40,
    height: 190,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  compactBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  badgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityDotAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#fff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  compactTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactFavorite: {
    position: 'absolute',
    top: 40,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  compactBody: {
    padding: 16,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  compactTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactSeparator: {
    width: 1,
    height: 18,
    marginHorizontal: 12,
  },
  imageWrapper: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  flatList: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    height: 240,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  infoSection: {
    padding: 16,
    paddingHorizontal: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  priceSubText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    gap: 4,
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PropertyCard;
