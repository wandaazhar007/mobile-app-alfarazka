import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import LocationTrackingScreen from '../screens/seller/LocationTrackingScreen';

export type SellerStackParamList = {
  SellerDashboard: undefined;
  LocationTracking: undefined;
};

const Stack = createNativeStackNavigator<SellerStackParamList>();

// Native header dimatikan (headerShown: false) untuk SellerDashboard — alignment kiri
// + icon logout dibangun custom di dalam screen-nya sendiri, karena headerTitleAlign/
// headerRight bawaan native-stack tidak konsisten pixel-perfect lintas iOS/Android
// untuk kasus ini. LocationTracking adalah layar drill-down (dibuka dari dashboard),
// jadi pakai native header biasa (tombol back otomatis + title), bukan AppNavbar.
export default function SellerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <Stack.Screen
        name="LocationTracking"
        component={LocationTrackingScreen}
        options={{ headerShown: true, title: 'Lacak Lokasi' }}
      />
    </Stack.Navigator>
  );
}
