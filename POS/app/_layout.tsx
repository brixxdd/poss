import { Stack } from 'expo-router';
import { AlertProvider } from './components/AlertProvider';

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Sin animación = Sin destello
          contentStyle: {
            backgroundColor: '#0f0c29', // Fondo oscuro consistente
          },
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="(admin)" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="sales" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="inventory" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
      </Stack>
    </AlertProvider>
  );
}