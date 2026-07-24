import * as Location from 'expo-location';

export type PermissionOutcome = 'granted' | 'foreground-only' | 'denied';

// Android MEWAJIBKAN alur 2 tahap — minta foreground dulu, background belakangan
// (kalau langsung minta background duluan, request-nya ditolak OS). iOS juga ikut
// pola yang sama supaya 1 kode jalan konsisten di kedua platform.
export async function requestLocationPermissions(): Promise<PermissionOutcome> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return 'denied';
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    // Tetap izinkan tracking selagi app dibuka (foreground) — TIDAK bisa lacak
    // saat app ditutup/HP terkunci tanpa izin background, tapi jangan blokir
    // total kalau penjual cuma mau kasih izin sebagian.
    return 'foreground-only';
  }

  return 'granted';
}

export async function getCurrentPermissionStatus(): Promise<PermissionOutcome> {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return 'denied';

  const background = await Location.getBackgroundPermissionsAsync();
  return background.status === 'granted' ? 'granted' : 'foreground-only';
}
