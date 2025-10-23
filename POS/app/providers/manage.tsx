import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config';

export default function ManageProviderScreen() {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get provider ID from URL for editing

  useEffect(() => {
    if (id) {
      fetchProvider(id as string);
    }
  }, [id]);

  const fetchProvider = async (providerId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const provider = response.data;
      setName(provider.name);
      setContactInfo(provider.contact_info);
    } catch (error: any) {
      console.error('Error fetching provider for edit:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch provider for edit.');
    }
  };

  const handleSubmit = async () => {
    const providerData = {
      name,
      contact_info: contactInfo,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (id) {
        // Update existing provider
        await axios.put(`${BACKEND_URL}/api/providers/${id}`, providerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Success', 'Provider updated successfully!');
      } else {
        // Create new provider
        await axios.post(`${BACKEND_URL}/api/providers`, providerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Success', 'Provider created successfully!');
      }
      router.replace('/providers'); // Go back to provider list
    } catch (error: any) {
      console.error('Error saving provider:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save provider.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{id ? 'Edit Provider' : 'Add New Provider'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact Info"
        value={contactInfo}
        onChangeText={setContactInfo}
      />
      <Button title={id ? 'Update Provider' : 'Create Provider'} onPress={handleSubmit} />
      <Button title="Cancel" onPress={() => router.back()} color="gray" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
});
