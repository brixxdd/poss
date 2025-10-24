import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config'; // Adjusted import path
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../../AlertProvider'; // Adjusted import path

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function ManageProviderScreen() {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
  });
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const { showAlert } = useAlert();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (id) {
      fetchProvider(id as string);
    } else {
      setFormReady(true);
    }
  }, [id]);

  useEffect(() => {
    if (formReady) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true })
      ]).start();
    }
  }, [formReady]);

  const fetchProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const provider = response.data;
      setFormData({
        name: provider.name || '',
        contact_info: provider.contact_info || '',
      });
      setFormReady(true);
    } catch (error: any) {
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'Failed to fetch provider data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contact_info) {
      alertHelpers.warning(showAlert, 'Validation Error', 'Provider Name and Contact Info are required.');
      return;
    }
    setLoading(true);
    const providerData = {
      name: formData.name,
      contact_info: formData.contact_info,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = isEditing ? `${BACKEND_URL}/api/providers/${id}` : `${BACKEND_URL}/api/providers`;
      const method = isEditing ? 'put' : 'post';

      await axios[method](url, providerData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alertHelpers.success(showAlert, 'Success', `Provider ${isEditing ? 'updated' : 'created'} successfully!`, () => {
        router.replace('/(admin)/providers');
      });
    } catch (error: any) {
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'Failed to save provider.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key: keyof typeof formData, placeholder: string, icon: any, keyboardType: any = 'default') => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={formData[key]}
        onChangeText={(text) => handleInputChange(key, text)}
        keyboardType={keyboardType}
        editable={!loading}
      />
    </View>
  );

  if (!formReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Provider' : 'Add New Provider'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={30} tint="light" style={styles.formBlur}>
            {renderInput('name', 'Provider Name', 'business-outline')}
            {renderInput('contact_info', 'Contact Info (Email/Phone)', 'call-outline')}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={loading ? ['#ccc', '#999'] : ['#f093fb', '#f5576c']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                {loading ?
                  <ActivityIndicator color="#fff" /> :
                  <>
                    <Text style={styles.submitText}>{isEditing ? 'Update Provider' : 'Create Provider'}</Text>
                    <Ionicons name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'} size={22} color="#fff" />
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { padding: 5 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
  },
  formBlur: {
    borderRadius: 30,
    padding: 25,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    height: 55,
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});