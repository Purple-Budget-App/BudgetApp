import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { signInWithGoogle, signIn } from '../../firebaseConfig';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSignIn = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Error', result.error || 'Sign-In Failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          style={styles.passwordInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showButton}>
          <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <>
          <TouchableOpacity onPress={handleSignIn} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => {
            setLoading(true);
            const result = await signInWithGoogle();
            setLoading(false);

            if (result.success) {
              navigation.replace('MainTabs');
            } else {
              Alert.alert('Google Sign-In Error', result.error || 'Something went wrong with Google Sign-In');
            }
          }}>
            <Text style={styles.linkText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('SignUpScreen')}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f4', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '80%', padding: 12, borderWidth: 1, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '80%', borderWidth: 1, borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 12 },
  showButton: { padding: 12 },
  showText: { color: '#007bff', fontSize: 16 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, marginTop: 15, width: '80%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#007bff', marginTop: 10, fontSize: 16 },
});

export default AuthScreen;
