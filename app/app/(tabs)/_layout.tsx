import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'camera' : 'camera-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
