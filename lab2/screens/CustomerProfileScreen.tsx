/* eslint-disable react-native/no-inline-styles */
// filepath: screens/Customer/CustomerProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth'; // Thêm import này

// Mock function to get user profile
const fetchUserProfile = async () => {
    // Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
    return {
        id: 'cust123',
        name: 'John Doe',
        email: 'customer@spa.com', // Should come from auth state/API
        phone: '123-456-7890',
    };
};

const CustomerProfileScreen = ({ navigation }: { navigation: any }) => {
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const data = await fetchUserProfile();
            setProfile(data);
            setName(data.name);
            setPhone(data.phone || ''); // Handle potentially missing phone
            setLoading(false);
        };
        loadProfile();
    }, []);

    const handleUpdateProfile = () => {
        // --- Add API call to update profile ---
        console.log('Updating profile:', { name, phone });
        Alert.alert('Success', 'Profile updated (placeholder).');
        setProfile((prev: any) => ({ ...prev, name, phone })); // Update local state optimistically
        setEditing(false); // Exit editing mode
        // --- End API call ---
    };

    const handleLogout = async () => {
        try {
            await auth().signOut();
            // AppNavigator sẽ tự động phát hiện thay đổi trạng thái và chuyển hướng
            Alert.alert('Logged Out', 'You have been logged out.');
        } catch (error) {
            console.error('Error signing out: ', error);
            Alert.alert('Error', 'Could not log out. Please try again.');
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Profile</Text>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile?.email}</Text>
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Name:</Text>
                {editing ? (
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />
                ) : (
                    <Text style={styles.value}>{name}</Text>
                )}
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone:</Text>
                {editing ? (
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                ) : (
                    <Text style={styles.value}>{phone || 'Not set'}</Text>
                )}
            </View>

            {editing ? (
                <View style={styles.buttonGroup}>
                    <Button title="Save Changes" onPress={handleUpdateProfile} />
                    <View style={{ height: 10 }} />
                    <Button title="Cancel" color="gray" onPress={() => {
                        // Reset fields to original values
                        setName(profile.name);
                        setPhone(profile.phone || '');
                        setEditing(false);
                    }} />
                </View>
            ) : (
                <View style={styles.buttonGroup}>
                    <Button title="Edit Profile" onPress={() => setEditing(true)} />
                </View>
            )}

            <View style={styles.buttonGroup}>
                <Button title="Change Password" onPress={() => navigation.navigate('CustomerChangePassword')} />
            </View>

            <View style={[styles.buttonGroup, styles.logoutButton]}>
                 <Button title="Logout" color="red" onPress={handleLogout} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        paddingVertical: 8, // Add padding for alignment with input
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    buttonGroup: {
        marginTop: 20,
    },
    logoutButton: {
        marginTop: 40,
    }});

export default CustomerProfileScreen;
