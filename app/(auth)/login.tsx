import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Switch } from '@components/ui/Switch';
import { useAuth } from '@hooks/useAuth';
import { colors } from '@theme/colors';
import { borderRadius, spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shakeX = useSharedValue(0);
  const entryTranslateY = useSharedValue(20);
  const entryOpacity = useSharedValue(0);

  useEffect(() => {
    entryTranslateY.value = withTiming(0, { duration: 600 });
    entryOpacity.value = withTiming(1, { duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: entryTranslateY.value }],
    opacity: entryOpacity.value,
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleLogin = async () => {
    setError(null);

    const result = await auth.login(username, password, rememberMe);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(main)');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      setError(result.error || 'Invalid username or password');
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary.blueDark, colors.primary.blue]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.header, entryStyle]}>
              <Text style={styles.title}>SRCGo</Text>
              <Text style={styles.subtitle}>UCR Authentication</Text>
            </Animated.View>

            <Animated.View style={[shakeStyle, entryStyle]}>
              <Card variant="premium" style={styles.card}>
                <Input
                  label="UCR NetID"
                  placeholder="Enter your NetID"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!auth.isLoading}
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!auth.isLoading}
                />

                <Switch
                  label="Remember me"
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  disabled={auth.isLoading}
                  style={styles.switch}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text
                      style={styles.errorText}
                      accessibilityRole="alert"
                      accessibilityLiveRegion="assertive"
                    >
                      {error}
                    </Text>
                  </View>
                )}

                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  isLoading={auth.isLoading}
                  disabled={!username || !password || auth.isLoading}
                  style={styles.button}
                />
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.gold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral.white,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
  },
  switch: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.semantic.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
});
