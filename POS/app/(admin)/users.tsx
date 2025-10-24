import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Placeholder for user data structure
interface User {
  id: string;
  username: string;
  role: string;
}

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchUsers();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true })
    ]).start();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const dummyUsers: User[] = [
        { id: '1', username: 'admin', role: 'admin' },
        { id: '2', username: 'employee1', role: 'employee' },
        { id: '3', username: 'employee2', role: 'employee' },
      ];
      setUsers(dummyUsers);
      setLoading(false);
    }, 1000);
  };

  const handleAddUser = () => {
    // Navigate to a screen for adding a new user
    Alert.alert(
      'Add User',
      'This would navigate to a screen to add a new user.',
      [{ text: 'OK' }],
    );
    // router.push('/(admin)/users/add'); // Example navigation
  };

  const handleEditUser = (user: User) => {
    // Navigate to a screen for editing a user
    Alert.alert(
      'Edit User',
      `This would navigate to a screen to edit user: ${user.username}.`,
      [{ text: 'OK' }],
    );
    // router.push(`/(admin)/users/${user.id}`); // Example navigation
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user: ${user.username}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            // Simulate API call for deletion
            setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
            Alert.alert('Deleted', `User ${user.username} deleted successfully.`);
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={30} tint="light" style={styles.formBlur}>
            {users.length === 0 ? (
              <Text style={styles.noUsersText}>No users found. Add one!</Text>
            ) : (
              users.map(user => (
                <View key={user.id} style={styles.userItem}>
                  <View>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userRole}>{user.role}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity onPress={() => handleEditUser(user)} style={styles.actionButton}>
                      <Ionicons name="create-outline" size={24} color="#4facfe" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(user)} style={styles.actionButton}>
                      <Ionicons name="trash-outline" size={24} color="#ff5858" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
              <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.addButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New User</Text>
              </LinearGradient>
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
    backgroundColor: '#4facfe',
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
  noUsersText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addButton: {
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});