import { initializeApp } from 'firebase/app';
// PENTING: import dari '@firebase/auth' (paket internal), BUKAN 'firebase/auth' —
// package.json wrapper 'firebase' versi ini tidak meneruskan kondisi export
// "react-native" untuk subpath './auth', jadi getReactNativePersistence tidak
// pernah ke-export lewat 'firebase/auth' di React Native/Metro maupun tsc. Ini
// bukan typo; sudah dicek langsung isi node_modules sebelum ditulis begini.
//
// @firebase/auth's package.json exports punya "types" bersama (tidak per-platform)
// yang mengarah ke deklarasi generic tanpa getReactNativePersistence — walau di
// RUNTIME (Metro, via customConditions:["react-native"] atau field "react-native"
// legacy) resolve dengan benar ke build RN yang punya fungsi ini. Baris di bawah ini
// karena itu type-error palsu (fungsinya beneran ada saat run), bukan bug kode.
// @ts-expect-error - lihat komentar di atas: getReactNativePersistence ada di runtime RN, cuma type declarations @firebase/auth tidak per-platform.
import { initializeAuth, getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirror frontend/src/config/firebase.ts — env var WAJIB prefix EXPO_PUBLIC_ supaya
// ikut ter-embed di client bundle (setara VITE_ di frontend web).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// React Native tidak punya localStorage/session cookie seperti web — persistence
// SELALU harus dipasang eksplisit lewat AsyncStorage, kalau tidak sesi login hilang
// tiap kali app di-kill.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
