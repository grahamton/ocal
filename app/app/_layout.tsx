import {Stack} from 'expo-router';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ThemeProvider, useTheme} from '@/shared/ThemeContext';
import {SessionProvider} from '@/shared/SessionContext';
import {IdentifyQueueProvider} from '@/ai/IdentifyQueueService';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GradientBackground} from '@/shared/components/GradientBackground';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {View, Text, StatusBar} from 'react-native';

// Dark status-bar icons on the light theme (they were white-on-white).
function ThemedStatusBar() {
  const {mode} = useTheme();
  return <ExpoStatusBar style={mode === 'high-contrast' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
        }}>
        <StatusBar barStyle="light-content" />
        <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>
          Ocal...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <ThemedStatusBar />
        <SessionProvider>
          <IdentifyQueueProvider>
            <SafeAreaProvider>
              <GradientBackground>
                <Stack screenOptions={{headerShown: false}}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="settings"
                    options={{presentation: 'modal'}}
                  />
                  <Stack.Screen
                    name="detail/[id]"
                    options={{presentation: 'modal'}}
                  />
                </Stack>
              </GradientBackground>
            </SafeAreaProvider>
          </IdentifyQueueProvider>
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
