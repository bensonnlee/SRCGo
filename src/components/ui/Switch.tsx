import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Switch as RNSwitch,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
  style,
}: SwitchProps) {
  const handleValueChange = (newValue: boolean) => {
    Haptics.selectionAsync();
    onValueChange(newValue);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
      <RNSwitch
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.neutral.gray200,
          true: colors.primary.blue,
        }}
        thumbColor={value ? colors.primary.gold : colors.neutral.white}
        ios_backgroundColor={colors.neutral.gray200}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.neutral.gray800,
    flex: 1,
  },
  labelDisabled: {
    color: colors.neutral.gray500,
  },
});
