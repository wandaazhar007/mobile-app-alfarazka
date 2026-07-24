import api from './api';
import type { LocationPing } from '../types/locationPing';

// POST /api/seller/location terima 1 ping (body langsung) ATAU batch {pings:[...]}
// (backend/src/controllers/SellerLocationController.js) — dipakai locationQueue.ts
// untuk flush antrian offline sekaligus, bukan 1-request-per-ping.
export async function postLocationBatch(pings: LocationPing[]): Promise<void> {
  if (pings.length === 0) return;
  await api.post('/api/seller/location', { pings });
}
