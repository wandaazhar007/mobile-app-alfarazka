import { View, Text, StyleSheet } from 'react-native';

// RN version of frontend/src/components/StatCard/StatCard.tsx — same 4 variants.
type Variant = 'default' | 'highlight' | 'success' | 'danger';

interface Props {
  label: string;
  value: string;
  variant?: Variant;
}

export default function StatCard({ label, value, variant = 'default' }: Props) {
  const isSuccess = variant === 'success';
  const isHighlight = variant === 'highlight';
  const isDanger = variant === 'danger';

  return (
    <View
      style={[
        styles.card,
        isSuccess && styles.cardSuccess,
        isHighlight && styles.cardHighlight,
      ]}
    >
      <Text style={[styles.label, isSuccess && styles.textOnSuccess, isDanger && styles.textDanger]}>{label}</Text>
      <Text style={[styles.value, isSuccess && styles.textOnSuccess, isDanger && styles.textDanger]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardSuccess: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  cardHighlight: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  textOnSuccess: {
    color: '#fff',
  },
  textDanger: {
    color: '#dc2626',
  },
});
