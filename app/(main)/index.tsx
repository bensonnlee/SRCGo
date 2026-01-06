import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeDisplay } from '@components/barcode/BarcodeDisplay';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useAuth } from '@hooks/useAuth';
import { useBarcode } from '@hooks/useBarcode';
import { useSettings } from '@context/SettingsContext';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing, borderRadius } from '@theme/spacing';

export default function BarcodeScreen() {
  const auth = useAuth();
  const settings = useSettings();
  const originalBrightnessRef = useRef<number | null>(null);
  const [isBrightnessMaxed, setIsBrightnessMaxed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brightnessToggleInProgress = useRef(false);

  const { barcodeId, isLoading, error, timeUntilRefresh, refresh } = useBarcode(
    auth.fusionToken,
    undefined,
    settings.autoRefresh,
    auth.isDemoMode
  );

  // Handle screen brightness from settings (keep screen bright toggle)
  useEffect(() => {
    let isMounted = true;

    const manageBrightness = async () => {
      try {
        // Check if brightness API is available
        const isAvailable = await Brightness.isAvailableAsync?.() ?? true;
        if (!isAvailable || !isMounted) return;

        if (settings.keepScreenBright) {
          const current = await Brightness.getBrightnessAsync();
          if (isMounted) {
            originalBrightnessRef.current = current;
            await Brightness.setBrightnessAsync(1);
          }
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
      isMounted = false;
      if (originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, [settings.keepScreenBright]);

  // Cleanup tooltip timeout and brightness on unmount
  useEffect(() => {
    return () => {
      // Clear tooltip timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      // Restore brightness if it was toggled via barcode tap
      if (originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, []);

  // Handle barcode press brightness toggle
  const handleBarcodePress = useCallback(async () => {
    // Prevent race conditions from rapid taps
    if (brightnessToggleInProgress.current) return;
    brightnessToggleInProgress.current = true;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const isAvailable = await Brightness.isAvailableAsync?.() ?? true;
      if (!isAvailable) {
        brightnessToggleInProgress.current = false;
        return;
      }

      if (!isBrightnessMaxed) {
        // Save current brightness and set to max
        if (originalBrightnessRef.current === null) {
          originalBrightnessRef.current = await Brightness.getBrightnessAsync();
        }
        await Brightness.setBrightnessAsync(1);
        setIsBrightnessMaxed(true);
      } else {
        // Restore original brightness
        if (originalBrightnessRef.current !== null) {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
          originalBrightnessRef.current = null;
        }
        setIsBrightnessMaxed(false);
      }
    } catch {
      // Brightness API not available or permission denied
    } finally {
      brightnessToggleInProgress.current = false;
    }
  }, [isBrightnessMaxed]);

  // Clear tooltip timeout helper
  const clearTooltipTimeout = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  }, []);

  // Hide tooltip helper
  const hideTooltip = useCallback(() => {
    clearTooltipTimeout();
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowTooltip(false));
  }, [clearTooltipTimeout, tooltipOpacity]);

  // Handle info button press - show/hide tooltip
  const handleInfoPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (showTooltip) {
      hideTooltip();
    } else {
      // Clear any existing timeout before showing
      clearTooltipTimeout();

      setShowTooltip(true);
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 3 seconds
      tooltipTimeoutRef.current = setTimeout(() => {
        hideTooltip();
      }, 3000);
    }
  }, [showTooltip, tooltipOpacity, hideTooltip, clearTooltipTimeout]);

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
        <View style={styles.barcodeCardWrapper}>
          <Card style={[styles.barcodeCard, isBrightnessMaxed && styles.barcodeCardActive]}>
            <BarcodeDisplay
              value={barcodeId ?? ''}
              isLoading={isLoading && !barcodeId}
              onPress={handleBarcodePress}
              isBrightnessActive={isBrightnessMaxed}
            />
          </Card>

          {/* Info Button */}
          <Pressable
            style={({ pressed }) => [
              styles.infoButton,
              pressed && styles.infoButtonPressed,
            ]}
            onPress={handleInfoPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Info"
            accessibilityHint="Tap to see how to use brightness toggle"
            accessibilityRole="button"
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.primary.blue}
            />
          </Pressable>

          {/* Tooltip */}
          {showTooltip && (
            <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
              <Text style={styles.tooltipText}>
                Tap the barcode to toggle maximum brightness
              </Text>
              <View style={styles.tooltipArrow} />
            </Animated.View>
          )}
        </View>

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
  barcodeCardWrapper: {
    position: 'relative',
  },
  barcodeCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  barcodeCardActive: {
    borderColor: colors.primary.gold,
    shadowColor: colors.primary.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  infoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 10,
    borderRadius: 12,
  },
  infoButtonPressed: {
    opacity: 0.6,
    backgroundColor: colors.neutral.gray200,
  },
  tooltip: {
    position: 'absolute',
    top: spacing.sm + 32,
    right: spacing.sm,
    backgroundColor: colors.neutral.gray800,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    maxWidth: 220,
    zIndex: 20,
  },
  tooltipText: {
    color: colors.neutral.white,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    right: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.neutral.gray800,
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
