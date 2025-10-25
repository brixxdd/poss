import { Stack } from 'expo-router';
import { AlertProvider } from './components/AlertProvider';

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AlertProvider>
  );
}