import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { ParentReelCard } from './ParentReelCard';
import { useRouter } from 'expo-router';

interface ParentReelSectionProps {
  title: string;
  data: any[];
  category: 'tower' | 'apartment' | 'market' | 'sharak';
}

export const ParentReelSection = ({ title, data, category }: ParentReelSectionProps) => {
  const themeColors = useThemeColor();
  const router = useRouter();

  const handlePress = (id: number) => {
    // Navigate to the parent profile page
    // Pattern: /parent/[category]/[id]
    router.push(`/parent/${category}/${id}`);
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { borderColor: themeColors.border }]}>
      <AppText variant="caption" color={themeColors.subtext}>
        No {title.toLowerCase()} available yet
      </AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title" weight="bold" color={themeColors.text}>
          {title}
        </AppText>
      </View>
      
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ParentReelCard 
            item={{...item, category}} 
            onPress={() => handlePress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  emptyContainer: {
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginLeft: 20,
  },
});
