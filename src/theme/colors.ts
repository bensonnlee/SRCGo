export const colors = {
  primary: {
    blue: '#003DA5',
    gold: '#FFB81C',
    lightBlue: '#87CEEB',
    rose: '#FF007F',
  },
  neutral: {
    white: '#FFFFFF',
    gray100: '#F5F5F5',
    gray200: '#E0E0E0',
    gray500: '#9E9E9E',
    gray800: '#424242',
    black: '#000000',
  },
  semantic: {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
  },
} as const;

export type Colors = typeof colors;
