import { Modal, View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { Seller } from '../types/seller';

// Simple picker (bukan Combobox searchable seperti web — jumlah penjual sedikit ~7,
// searchable list dianggap berlebihan untuk kebutuhan mobile ini).
interface Props {
  visible: boolean;
  sellers: Seller[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function SellerPickerModal({ visible, sellers, selectedId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>Pilih Penjual</Text>
          <FlatList
            data={sellers}
            keyExtractor={(s) => s.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                {item.id === selectedId && <Ionicons name="checkmark" size={20} color="#e63946" />}
              </Pressable>
            )}
          />
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </Pressable>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, maxHeight: '70%', backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowText: { fontSize: 14, color: '#111827' },
  closeButton: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  closeText: { color: '#6b7280', fontWeight: '600' },
});
