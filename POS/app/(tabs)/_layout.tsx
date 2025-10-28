import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
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
        name="index" 
        options={{ 
          headerShown: false,
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: false,
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerShown: false,
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="returns" 
        options={{ 
          headerShown: false,
          animation: 'none',
        }} 
      />
    </Stack>
  );
}

