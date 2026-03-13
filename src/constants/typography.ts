import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  hero: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  answer: {
    fontSize: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 32,
    letterSpacing: 0.5,
  },
};
