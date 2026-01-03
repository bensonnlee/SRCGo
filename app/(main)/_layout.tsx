import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.blue,
        },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'SRCGo',
          // @ts-expect-error - headerRightContainerStyle exists in React Navigation but missing from Expo Router types
          headerRightContainerStyle: {
            justifyContent: 'center',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(main)/settings')}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              style={{
                paddingHorizontal: 12,
              }}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.neutral.white}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Stack>
  );
}
