import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerMapScreen from '../screens/owner/SellerMapScreen';
import SellerTrailScreen from '../screens/owner/SellerTrailScreen';

export type LokasiPenjualStackParamList = {
  SellerMap: undefined;
  SellerTrail: { sellerId: string; sellerName: string };
};

const Stack = createNativeStackNavigator<LokasiPenjualStackParamList>();

// Stack utk tab "Lokasi Penjual" — SellerMap pakai AppNavbar custom (headerShown: false,
// sama pola semua tab lain), SellerTrail adalah drill-down detail jadi tetap pakai
// native header (ada tombol back bawaan) — TIDAK perlu AppNavbar.
export default function LokasiPenjualStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SellerMap" component={SellerMapScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SellerTrail"
        component={SellerTrailScreen}
        options={({ route }) => ({ title: `Jejak: ${route.params.sellerName}` })}
      />
    </Stack.Navigator>
  );
}
