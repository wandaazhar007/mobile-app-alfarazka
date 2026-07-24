import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';

// Setara localStorage di web (frontend/src/pages/Login.tsx juga persist email,
// TIDAK password — sensitif) — AsyncStorage adalah padanan RN-nya.
const REMEMBERED_EMAIL_KEY = 'alfarazka.rememberedEmail';

// Sama persis dengan frontend/src/pages/Login.tsx.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
}

// Versi RN dari frontend/src/pages/Login.tsx — alur email+password + validasi per-field
// (border merah + pesan merah di bawah field, sama seperti FormField.tsx di web), tanpa
// "lupa password" dulu (bisa ditambah nanti, tidak masuk scope Fase B).
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then((saved) => {
      if (saved) setEmail(saved);
    });
  }, []);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!email.trim()) nextErrors.email = 'Email wajib diisi.';
    else if (!EMAIL_REGEX.test(email.trim())) nextErrors.email = 'Format email tidak valid.';
    if (!password) nextErrors.password = 'Password wajib diisi.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      // Berhasil login -> onAuthStateChanged di AuthContext yang urus sisanya (sync ke
      // backend, isi appUser), navigasi otomatis pindah lewat RootNavigator.
    } catch {
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // KeyboardAvoidingView + ScrollView: tanpa ini, keyboard menutupi field/tombol di HP
    // dan tidak ada cara menutup keyboard selain tombol "return" di keyboard OS.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Alfarazka Bakery</Text>
          <Text style={styles.subtitle}>Masuk ke akun Anda</Text>

          <View style={styles.fieldGroup}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="Password"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onSubmitEditing={handleSubmit}
              />
              <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
              </Pressable>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk</Text>}
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#e63946',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
