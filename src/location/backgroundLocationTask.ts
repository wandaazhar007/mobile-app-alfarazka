import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { enqueue, flushQueue } from './locationQueue';
import type { LocationPing } from '../types/locationPing';

// Nama task WAJIB sama persis di semua tempat yang mereferensikannya
// (startLocationUpdatesAsync/stopLocationUpdatesAsync/hasStartedLocationUpdatesAsync).
export const LOCATION_TASK_NAME = 'alfarazka-seller-location-task';

// defineTask HARUS dipanggil di module scope (bukan di dalam komponen), dan file ini
// HARUS di-import sekali di App.tsx SEBELUM apapun lain — supaya OS bisa panggil ulang
// task ini lewat headless JS context walau app sudah di-kill total, bukan cuma di-background.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }

  const { locations } = (data as { locations: Location.LocationObject[] }) ?? { locations: [] };
  if (!locations || locations.length === 0) return;

  // Battery level opsional (bisa gagal di beberapa device/emulator) — jangan sampai
  // satu ping gagal terkirim gara-gara baterai gagal dibaca.
  let batteryLevel: number | null = null;
  try {
    const level = await Battery.getBatteryLevelAsync();
    if (level >= 0) batteryLevel = Math.round(level * 100);
  } catch {
    batteryLevel = null;
  }

  for (const location of locations) {
    const ping: LocationPing = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      speed: location.coords.speed ?? null,
      heading: location.coords.heading ?? null,
      batteryLevel,
      recordedAt: new Date(location.timestamp).toISOString(),
    };
    await enqueue(ping);
  }

  // Langsung coba kirim begitu ada ping baru — kalau gagal (offline/token belum
  // siap saat headless launch), tetap aman karena sudah ke-simpan di antrian di atas.
  await flushQueue();
});
