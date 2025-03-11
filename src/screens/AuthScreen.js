import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithGoogle, signOut, signIn, signUp } from '../../firebaseConfig';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleSignUp = async () => {
    const result = await signUp(email, password);
    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Google Sign-In Error', result.error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Firebase Authentication</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, width: 250, marginBottom: 10, padding: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, width: 250, marginBottom: 20, padding: 10 }}
      />
      <TouchableOpacity onPress={handleSignIn} style={{ backgroundColor: 'blue', padding: 10, marginBottom: 10 }}>
        <Text style={{ color: 'white' }}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSignUp} style={{ backgroundColor: 'green', padding: 10, marginBottom: 10 }}>
        <Text style={{ color: 'white' }}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGoogleSignIn} style={{ backgroundColor: 'red', padding: 10 }}>
        <Text style={{ color: 'white' }}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthScreen;
