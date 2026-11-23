import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/shared/ThemeContext';

export default function TabLayout() {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {backgroundColor: colors.background},
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        // Tall enough for large system font sizes, and clear of the
        // Android gesture bar (labels were getting cut off).
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 2,
          height: 76 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: {fontSize: 16, fontWeight: '700'},
        tabBarAllowFontScaling: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Take Photo',
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? 'camera' : 'camera-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'My Rocks',
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
