import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// Mirror frontend/src/services/api.ts. EXPO_PUBLIC_API_BASE_URL setara VITE_API_BASE_URL.
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;

  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }

  return config;
});

// Sama seperti frontend: 401 = token benar-benar tidak valid lagi (bukan cuma
// expired — getIdToken() di atas sudah auto-refresh) → logout bersih.
// TODO: ganti console.warn dengan toast/alert in-app begitu ada komponen notifikasi bersama.
let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => {
    sessionExpiredHandled = false;
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 && !sessionExpiredHandled) {
      sessionExpiredHandled = true;
      console.warn('Sesi telah berakhir, silakan masuk kembali.');
      await signOut(auth);
    }
    return Promise.reject(error);
  }
);

export default api;
