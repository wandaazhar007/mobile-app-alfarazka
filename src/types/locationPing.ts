// Bentuk 1 titik lokasi yang dikirim ke POST /api/seller/location — cocok dengan
// validatePing() di backend/src/controllers/SellerLocationController.js.
export interface LocationPing {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  recordedAt: string;
}
