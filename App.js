import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { supabase } from './src/api';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Anton-Regular': require('./assets/fonts/Anton-Regular.ttf'),
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    return null;
  }

  const initialRouteName = session ? 'Main' : 'Login';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator initialRouteName={initialRouteName} />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

