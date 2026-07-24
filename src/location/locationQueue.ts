import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationPing } from '../types/locationPing';
import { postLocationBatch } from '../services/locationApi';

const QUEUE_KEY = 'alfarazka.locationQueue';
// Jaga-jaga kalau HP offline lama (di jalan tanpa sinyal) — jangan biarkan antrian
// tumbuh tak terbatas dan menghabiskan storage; buang yang paling lama dulu.
const MAX_QUEUE_SIZE = 500;

async function readQueue(): Promise<LocationPing[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocationPing[];
  } catch {
    return [];
  }
}

async function writeQueue(pings: LocationPing[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pings));
}

export async function enqueue(ping: LocationPing): Promise<void> {
  const queue = await readQueue();
  queue.push(ping);
  const trimmed = queue.length > MAX_QUEUE_SIZE ? queue.slice(queue.length - MAX_QUEUE_SIZE) : queue;
  await writeQueue(trimmed);
}

// Dipanggil setelah tiap ping baru (dari backgroundLocationTask) DAN setiap kali
// LocationTrackingScreen dibuka — supaya antrian tidak menumpuk lama-lama kalau
// device sempat offline pas ping direkam, tapi online lagi belakangan.
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { sent: 0, remaining: 0 };

  try {
    await postLocationBatch(queue);
    await writeQueue([]);
    return { sent: queue.length, remaining: 0 };
  } catch {
    // Gagal kirim (offline/token belum siap) — biarkan tetap di antrian, dicoba
    // lagi lain kali. Bukan error yang perlu ditampilkan ke penjual.
    return { sent: 0, remaining: queue.length };
  }
}

export async function getQueueSize(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
