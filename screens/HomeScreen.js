import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, Alert, FlatList, Platform } from 'react-native';
import { signOut, getCurrentUser } from '../firebaseConfig';
import { create, open, dismissLink, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk';

const HomeScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [linkToken, setLinkToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const address = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

  // Logout function
  const handleLogout = async () => {
    await signOut();
    navigation.replace('Auth');
  };

  // Function to fetch link token
  const createLinkToken = useCallback(async () => {
    try {
      const response = await fetch(`http://${address}:5000/create_link_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error fetching Plaid link token:", error);
    }
  }, []);

  // Fetch link token on mount
  useEffect(() => {
    if (!linkToken) {
      createLinkToken();
    } else {
      create({ token: linkToken });
    }
  });

  // Configure Link Open Props
  const createLinkOpenProps = () => ({
    onSuccess: async (success) => {
      console.log("Plaid Success:", success.publicToken);

      try {
        const response = await fetch(`http://${address}:5000/exchange_public_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: success.publicToken }),
        });

        const data = await response.json();
        setAccessToken(data.access_token);
        Alert.alert("Success", "Bank Linked Successfully!");
      } catch (error) {
        console.error("Error exchanging public token:", error);
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
    open(createLinkOpenProps());
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token available.");
      return;
    }

    try {
      const response = await fetch(`http://${address}:5000/get_transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
