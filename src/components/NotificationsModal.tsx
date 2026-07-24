import { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatTimeAgo } from '../utils/timeAgo';
import { navigateToNotificationType } from '../notifications/notificationDestinations';
import { SkeletonBlock } from './Skeleton';
import type { AppNotification } from '../types/notification';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

// Panel geser dari bawah (bukan modal card kecil seperti ConfirmModal) — daftar
// notifikasi butuh ruang lebih, sama pola dengan sheet penuh di app lain.
export default function NotificationsModal({ visible, onClose, onUnreadCountChange }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback((isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications);
        onUnreadCountChange?.(data.unreadCount);
      })
      .catch(() => setError(true))
      .finally(() => (isRefresh ? setRefreshing(false) : setLoading(false)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visible) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handlePress = async (item: AppNotification) => {
    onClose();
    navigateToNotificationType(item.type);

    if (!item.read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      onUnreadCountChange?.(notifications.filter((n) => !n.read && n.id !== item.id).length);
      try {
        await api.put(`/api/notifications/${item.id}/read`);
      } catch {
        // best-effort — sinkron ulang kali berikutnya modal dibuka
      }
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onUnreadCountChange?.(0);
    try {
      await api.put('/api/notifications/read-all');
    } catch {
      // best-effort — sinkron ulang kali berikutnya modal dibuka
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifikasi</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#111827" />
          </Pressable>
        </View>

        {hasUnread && (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Tandai semua dibaca</Text>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.listContent}>
            <SkeletonBlock style={styles.skeletonItem} />
            <SkeletonBlock style={styles.skeletonItem} />
            <SkeletonBlock style={styles.skeletonItem} />
          </View>
        ) : error ? (
          <View style={styles.listContent}>
            <Text style={styles.errorText}>Gagal memuat notifikasi.</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.listContent}>
            <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, !item.read && styles.itemUnread]}
                onPress={() => handlePress(item)}
              >
                {!item.read && <View style={styles.unreadDot} />}
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemBody}>{item.body}</Text>
                  <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  markAllButton: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 8 },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#e63946' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12, textAlign: 'center', marginTop: 40 },
  retryButton: {
    alignSelf: 'center',
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonItem: { height: 76, borderRadius: 10, marginBottom: 10 },
  item: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  itemUnread: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e63946', marginTop: 6, marginRight: 10 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemBody: { fontSize: 13, color: '#374151', marginTop: 2 },
  itemTime: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
});
