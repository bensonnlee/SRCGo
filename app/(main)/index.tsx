import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';
import { BarcodeDisplay } from '@components/barcode/BarcodeDisplay';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useAuth } from '@hooks/useAuth';
import { useBarcode } from '@hooks/useBarcode';
import { useSettings } from '@context/SettingsContext';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';

export default function BarcodeScreen() {
  const auth = useAuth();
  const settings = useSettings();
  const originalBrightnessRef = useRef<number | null>(null);

  const { barcodeId, isLoading, error, timeUntilRefresh, refresh } = useBarcode(
    auth.fusionToken,
    undefined,
    settings.autoRefresh
  );

  // Handle screen brightness
  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (settings.keepScreenBright) {
          const current = await Brightness.getBrightnessAsync();
          originalBrightnessRef.current = current;
          await Brightness.setBrightnessAsync(1);
        } else if (originalBrightnessRef.current !== null) {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
          originalBrightnessRef.current = null;
        }
      } catch {
        // Brightness API not available or permission denied
      }
    };

    manageBrightness();

    return () => {
      if (originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, [settings.keepScreenBright]);

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If there's an error, try refreshing the token first
    if (error) {
      const refreshed = await auth.refreshToken();
      if (!refreshed) {
        // Token refresh failed, let normal refresh show error
        refresh();
        return;
      }
      // Token refreshed - useBarcode will get new token via auth.fusionToken
    }
    refresh();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card style={styles.barcodeCard}>
          <BarcodeDisplay
            value={barcodeId ?? ''}
            isLoading={isLoading && !barcodeId}
          />
        </Card>

        {settings.autoRefresh && (
          <View
            style={styles.timerContainer}
            accessible={true}
            accessibilityLabel={`Refreshing in ${timeUntilRefresh} seconds`}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.timerLabel}>Refreshing in {timeUntilRefresh}s</Text>
          </View>
        )}

        {error && (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {error}
          </Text>
        )}

        <Button
          title="Refresh Now"
          variant="outline"
          onPress={handleRefresh}
          isLoading={isLoading}
          style={styles.refreshButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.gray100,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  barcodeCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral.gray500,
  },
  refreshButton: {
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  hint: {
    textAlign: 'center',
    color: colors.neutral.gray500,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xl,
  },
});
