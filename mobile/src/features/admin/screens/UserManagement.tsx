import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { adminService } from '../../../services/admin.service';
import Avatar from '../../../components/Avatar';

const UserManagement = observer(() => {
  const router = useRouter();
  const { search: searchParam, role: roleParam, id: idParam } = useLocalSearchParams();
  const themeColors = useThemeColor();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState((searchParam as string) || '');
  const [roleFilter, setRoleFilter] = useState((roleParam as string) || ''); // user, agent, admin

  const fetchUsers = useCallback(async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = {
        page: pageNum,
        limit: 15,
        search,
        role: roleFilter,
      };

      if (idParam) {
          params.id = idParam;
      }

      const response = await adminService.getUsers(params);
      const { users: newUsers, pages } = response.data;
      
      setUsers(prev => shouldAppend ? [...prev, ...newUsers] : newUsers);
      setTotalPages(pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleUpdateRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'agent' ? 'user' : 'agent';
    const actionText = currentRole === 'agent' ? 'revoke Agent role' : 'promote to Agent';

    Alert.alert(
      'Update User Role',
      `Are you sure you want to ${actionText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              await adminService.updateUserRole(userId, newRole);
              fetchUsers(1); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to update user role');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (userId: number, name: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(userId);
              fetchUsers(1); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={styles.userMain}>
        <Avatar user={item} size="md" />
        <View style={styles.userInfo}>
          <AppText variant="body" weight="bold">{item.full_name}</AppText>
          <AppText variant="caption" color={themeColors.subtext}>{item.email}</AppText>
          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#fef2f2' : item.role === 'agent' ? '#eff6ff' : '#f9fafb' }]}>
              <AppText variant="tiny" weight="bold" color={item.role === 'admin' ? '#dc2626' : item.role === 'agent' ? '#2563eb' : '#6b7280'}>
                {item.role.toUpperCase()}
              </AppText>
            </View>
            <AppText variant="tiny" color={themeColors.subtext} style={{ marginLeft: 8 }}>
              Joined {new Date(item.createdAt).toLocaleDateString()}
            </AppText>
          </View>
        </View>
      </View>

      <View style={[styles.cardActions, { borderTopColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleUpdateRole(item.user_id, item.role)}
          disabled={item.role === 'admin'}
        >
          <Ionicons 
            name={item.role === 'agent' ? "person-remove-outline" : "shield-checkmark-outline"} 
            size={18} 
            color={item.role === 'admin' ? themeColors.border : themeColors.primary} 
          />
          <AppText 
            variant="caption" 
            weight="bold" 
            color={item.role === 'admin' ? themeColors.border : themeColors.primary} 
            style={{ marginLeft: 4 }}
          >
            {item.role === 'agent' ? 'Revoke Agent' : 'Make Agent'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDeleteUser(item.user_id, item.full_name)}
          disabled={item.role === 'admin'}
        >
          <Ionicons 
            name="trash-outline" 
            size={18} 
            color={item.role === 'admin' ? themeColors.border : '#ef4444'} 
          />
          <AppText 
            variant="caption" 
            weight="bold" 
            color={item.role === 'admin' ? themeColors.border : '#ef4444'} 
            style={{ marginLeft: 4 }}
          >
            Delete
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout backgroundColor={themeColors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <AppText variant="title" weight="bold" style={{ marginLeft: 16 }}>User Management</AppText>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subtext} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search by name or email..."
              placeholderTextColor={themeColors.subtext}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterTab label="All" active={roleFilter === ''} onPress={() => setRoleFilter('')} theme={themeColors} />
          <FilterTab label="Agents" active={roleFilter === 'agent'} onPress={() => setRoleFilter('agent')} theme={themeColors} />
          <FilterTab label="Normal" active={roleFilter === 'user'} onPress={() => setRoleFilter('user')} theme={themeColors} />
          <FilterTab label="Admins" active={roleFilter === 'admin'} onPress={() => setRoleFilter('admin')} theme={themeColors} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={item => item.user_id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (page < totalPages && !loadingMore) {
                fetchUsers(page + 1, true);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={themeColors.primary} /> : null}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText variant="body" color={themeColors.subtext}>No users found</AppText>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  );
});

const FilterTab = ({ label, active, onPress, theme }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.filterTab, 
      active && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
    ]}
  >
    <AppText variant="caption" weight="bold" color={active ? theme.primary : theme.subtext}>
      {label}
    </AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  filterTab: {
    paddingVertical: 8,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  userCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  userMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
});

export default UserManagement;
