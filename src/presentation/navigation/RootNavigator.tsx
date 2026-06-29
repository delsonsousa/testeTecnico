import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'styled-components/native';
import { AppTheme } from '@presentation/theme/theme';

import { SearchScreen } from '@presentation/screens/SearchScreen';
import { RecommendationScreen } from '@presentation/screens/RecommendationScreen';
import { ActivitiesScreen } from '@presentation/screens/ActivitiesScreen';
import { ActivityFormScreen } from '@presentation/screens/ActivityFormScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme() as AppTheme;
  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: theme.colors.night },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.night },
          headerTintColor: theme.colors.amber,
          headerTitleStyle: { color: theme.colors.textPrimary },
          contentStyle: { backgroundColor: theme.colors.night },
        }}
      >
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Recommendation"
          component={RecommendationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ActivityForm"
          component={ActivityFormScreen}
          options={{ title: '' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
