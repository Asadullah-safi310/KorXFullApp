import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { View, StyleSheet } from 'react-native';

export default observer(function TabLayout() {
  const { isAgent, isAdmin, isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColor();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subtext,
        tabBarStyle: {
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 5,
          backgroundColor: themeColors.card,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} size={24} color={color} />
          ),
        }}
      />
      
      {/* Sell/Rent FAB */}
      <Tabs.Screen
        name="create-property"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => (
            <View style={[styles.fabContainer, { backgroundColor: themeColors.card }]}>
              <View style={[styles.fab, { backgroundColor: themeColors.primary }]}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </View>
          ),
          tabBarLabelStyle: {
            marginTop: 15,
          },
          listeners: {
            tabPress: (event) => {
              event.preventDefault();
              if (isLoading) return;
              
              if (!isAuthenticated) {
                router.push('/(auth)/login');
              } else {
                router.push('/property/create');
              }
            },
          },
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bulb" : "bulb-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          href: (isAdmin || isAgent) ? '/(tabs)/people' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
});

const styles = StyleSheet.create({
  fabContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});