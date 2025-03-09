import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Function to register a new user
export const signUp = async (email, password) => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  // Function to log in a user
  export const signIn = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: '268228117382-pblle282saigq3h8kqc6umq1if9e4sdp.apps.googleusercontent.com', // Get this from Firebase Console
});

// Function to sign in with Google
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(googleCredential);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to log out
export const signOut = async () => {
  try {
    await auth().signOut();
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
};
// Function to get the currently logged-in user
export const getCurrentUser = () => {
    return auth().currentUser;
  };