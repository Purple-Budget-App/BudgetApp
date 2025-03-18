import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, Alert, FlatList } from 'react-native';
import { signOut, getCurrentUser } from '../../firebaseConfig';
import { create, open, dismissLink, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk';

// Firebase Firestore Import
import { getFirestore, doc, getDoc } from "firebase/firestore";

const HomeScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [linkToken, setLinkToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const address = 'https://plaid-backend-production.up.railway.app';
  const userId = user?.uid;
  const db = getFirestore();

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }], // ✅ Ensure AuthScreen is the only active screen
      });
    } catch (error) {
      console.error('❌ Logout Error:', error);
      Alert.alert('Logout Failed', error.message);
    }
  };

  // Fetch stored access token from Firestore
  const fetchStoredAccessToken = useCallback(async () => {
    if (!userId) return;
    
    try {
      const tokenRef = doc(db, "plaid_tokens", userId);
      const tokenSnap = await getDoc(tokenRef);

      if (tokenSnap.exists()) {
        console.log("✅ Retrieved Access Token from Firestore:", tokenSnap.data().access_token);
        setAccessToken(tokenSnap.data().access_token);
      } else {
        console.log("No Access Token Found in Firestore");
      }
    } catch (error) {
      console.error("Error fetching stored access token:", error);
    }
  }, [userId, db]);

  // Fetch link token
  const createLinkToken = useCallback(async () => {
    try {
      const response = await fetch(`${address}/create_link_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!data.link_token) throw new Error("Invalid Plaid Link Token");

      console.log("Link Token:", data.link_token);
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error fetching Plaid link token:", error);
      Alert.alert("Error", "Could not fetch Plaid Link Token.");
    }
  }, []);

  // Fetch access token from Firestore when component mounts
  useEffect(() => {
    fetchStoredAccessToken();
  }, [fetchStoredAccessToken]);

  // Fetch link token on mount
  useEffect(() => {
    if (!linkToken) {
      createLinkToken();
    } else {
      create({ token: linkToken });
    }
  }, [linkToken]);

  // Configure Link Open Props
  const createLinkOpenProps = () => ({
    onSuccess: async (success) => {
      console.log("Plaid Success:", success.publicToken);

      try {
        const response = await fetch(`${address}/exchange_public_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token: success.publicToken,
            userId: userId, // ✅ Send userId to store tokens in Firestore
          }),
        });

        const data = await response.json();
        if (data.success) {
          setAccessToken(data.access_token);
          Alert.alert("Success", "Bank Linked Successfully!");
        } else {
          throw new Error("Failed to save access token.");
        }
      } catch (error) {
        console.error("Error exchanging public token:", error);
        Alert.alert("Error", "Could not exchange public token.");
      }
    },
    onExit: (linkExit) => {
      console.log("User exited Plaid:", linkExit);
      dismissLink();
    },
    iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
    logLevel: LinkLogLevel.ERROR,
  });

  // Open Plaid Link
  const handleOpenLink = () => {
    if (!linkToken) {
      Alert.alert("Error", "No Plaid Link Token available.");
      return;
    }
    open(createLinkOpenProps());
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    if (!userId || !accessToken) {
      Alert.alert("Error", "No access token available.");
      return;
    }

    try {
      const response = await fetch(`${address}/transactions?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      console.log("✅ Transactions Retrieved:", data);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Could not fetch transactions.");
    }
  };
  const [balance, setBalance] = useState(null);

// Fetch Balance
const fetchBalance = async () => {
  if (!user?.uid) {
    Alert.alert("Error", "User ID is missing.");
    return;
  }

  try {
    const response = await fetch(`https://plaid-backend-production.up.railway.app/balance?userId=${user.uid}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    setBalance(data);
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
};

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text>Welcome, {user?.email || 'Guest'}!</Text>
      <Button title="Logout" onPress={handleLogout} />

      <Text style={{ fontSize: 18, marginBottom: 20 }}>Connect Your Bank Account</Text>
      <Button title="Open Plaid" onPress={handleOpenLink} />

      {accessToken && (
        <>
          <Text style={{ marginTop: 20 }}>Fetch Transactions</Text>
          <Button title="Get Transactions" onPress={fetchTransactions} />
        </>
      )}
      <View style={{marginTop:20}}>
      <Button title="Get Balance"  onPress={fetchBalance} />
      </View>
      {balance && (
        <FlatList
          data={balance}
          keyExtractor={(item) => item.account_id}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" }}>
              <Text style={{ marginTop: 20, fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
              <Text>Available: ${item.balances.available?.toFixed(2) || 'N/A'}</Text>
              <Text>Current: ${item.balances.current?.toFixed(2) || 'N/A'}</Text>
            </View>
          )}
  />
)}
      {/* Display Transactions */}
      {transactions.length > 0 && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.transaction_id}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" }}>
              <Text>{item.name}</Text>
              <Text>${item.amount.toFixed(2)}</Text>
              <Text>{item.date}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;
