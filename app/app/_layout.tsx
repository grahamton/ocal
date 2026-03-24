import { Stack } from 'expo-router';
import { AuthProvider } from '@/shared/AuthContext';
import { ThemeProvider } from '@/shared/ThemeContext';
import { SessionProvider } from '@/shared/SessionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GradientBackground } from '@/shared/components/GradientBackground';
import { useFonts, Outfit_400Regular, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useEffect } from 'react';
import { AnalyticsService } from '@/shared/AnalyticsService';
import { View, Text, StatusBar } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    AnalyticsService.logEvent('app_opened');
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Ocal...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <SessionProvider>
          <SafeAreaProvider>
            <GradientBackground>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="insights" options={{ presentation: 'modal' }} />
                <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
                <Stack.Screen name="session" options={{ presentation: 'modal' }} />
                <Stack.Screen name="detail/[id]" options={{ presentation: 'modal' }} />
              </Stack>
            </GradientBackground>
          </SafeAreaProvider>
        </SessionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
