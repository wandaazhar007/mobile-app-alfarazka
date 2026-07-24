// Mirror bentuk response backend/src/services/SellerLocationService.js `mapPosition()`.
export interface SellerPosition {
  sellerId: string;
  sellerName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  recordedAt: string;
}
