import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';

interface DealCardProps {
  deal: any;
  onPress: () => void;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const themeColors = useThemeColor();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return themeColors.success;
      case 'active': return themeColors.primary;
      case 'canceled': return themeColors.danger;
      default: return themeColors.subtext;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: themeColors.primary + '10' }]}>
          <AppText variant="caption" weight="bold" color={themeColors.primary}>{deal.deal_type}</AppText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(deal.status) }]} />
          <AppText variant="caption" weight="semiBold" color={getStatusColor(deal.status)}>
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </AppText>
        </View>
      </View>

      <View style={styles.content}>
        <AppText variant="title" weight="bold" numberOfLines={1} style={{ marginBottom: 4 }}>
          Property #{deal.property_id}
        </AppText>

        <View style={[styles.participants, { backgroundColor: themeColors.background + '80' }]}>
          <View style={styles.participant}>
            <AppText variant="caption" weight="medium" color={themeColors.subtext} style={styles.label}>Seller</AppText>
            <AppText variant="small" weight="semiBold" numberOfLines={1}>{deal.seller_name_snapshot || 'N/A'}</AppText>
          </View>
          <View style={styles.connector}>
            <Ionicons name="repeat" size={16} color={themeColors.border} />
          </View>
          <View style={styles.participant}>
            <AppText variant="caption" weight="medium" color={themeColors.subtext} style={styles.label}>Buyer</AppText>
            <AppText variant="small" weight="semiBold" numberOfLines={1}>{deal.buyer_name_snapshot || 'N/A'}</AppText>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <AppText variant="caption" weight="medium" color={themeColors.subtext} style={styles.label}>Deal Value</AppText>
            <AppText variant="h3" weight="bold">Rs {parseFloat(deal.price).toLocaleString()}</AppText>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={themeColors.subtext} style={{ marginRight: 4 }} />
            <AppText variant="caption" color={themeColors.subtext}>{formatDate(deal.start_date)}</AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    gap: 12,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  participant: {
    flex: 1,
  },
  connector: {
    paddingHorizontal: 10,
  },
  label: {
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    paddingTop: 12,
  },
  priceContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
