import { Stack } from 'expo-router';
import { AlertProvider } from './components/AlertProvider';

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Desactivar headers en toda la app
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Desactiva el gesto de deslizar hacia atrás
          }} 
        />
      </Stack>
    </AlertProvider>
  );
}