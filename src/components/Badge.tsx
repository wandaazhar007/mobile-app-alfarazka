import { View, Text, StyleSheet } from 'react-native';

// RN version of frontend/src/components/Badge/Badge.tsx (subset of tones actually used on mobile).
type Tone = 'success' | 'warning' | 'danger';

interface Props {
  tone?: Tone;
  children: string;
}

export default function Badge({ tone = 'success', children }: Props) {
  return (
    <View style={[styles.badge, toneStyles[tone].container]}>
      <Text style={[styles.text, toneStyles[tone].text]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const toneStyles = {
  success: StyleSheet.create({
    container: { backgroundColor: '#dcfce7' },
    text: { color: '#15803d' },
  }),
  warning: StyleSheet.create({
    container: { backgroundColor: '#fef3c7' },
    text: { color: '#92400e' },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: '#fee2e2' },
    text: { color: '#dc2626' },
  }),
};
