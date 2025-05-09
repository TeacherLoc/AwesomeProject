// filepath: screens/Customer/AppointmentListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator } from 'react-native';

// Mock function to get appointments
const fetchAppointments = async () => {
    // Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
    return [
        { id: 'apt1', serviceName: 'Massage Therapy', dateTime: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Confirmed' },
        { id: 'apt2', serviceName: 'Facial Treatment', dateTime: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'Pending' },
        { id: 'apt3', serviceName: 'Manicure', dateTime: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'Completed' },
    ];
};

const AppointmentListScreen = ({ navigation }: { navigation: any }) => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchAppointments();
            setAppointments(data);
            setLoading(false);
        };
        // Add listener for navigation focus to refresh data
        const unsubscribe = navigation.addListener('focus', loadData);
        loadData(); // Initial load
        return unsubscribe; // Cleanup listener on unmount
    }, [navigation]);

    const handleDelete = (id: string) => {
        Alert.alert(
            "Cancel Appointment",
            "Are you sure you want to cancel this appointment?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes", onPress: () => {
                        // --- Add API call to delete ---
                        console.log("Deleting appointment:", id);
                        setAppointments(prev => prev.filter(apt => apt.id !== id));
                        Alert.alert("Success", "Appointment cancelled.");
                        // --- End API call ---
                    }
                }
            ]
        );
    };

    const handleUpdate = (_item: any) => {
        // Navigate to an update screen, potentially reusing AppointmentScreen
        // Pass existing appointment data
        // navigation.navigate('CustomerUpdateAppointment', { appointmentData: item });
        Alert.alert("Info", "Update functionality not implemented yet.");
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View style={styles.itemDetails}>
                <Text style={styles.itemService}>{item.serviceName}</Text>
                <Text style={styles.itemDate}>Date: {new Date(item.dateTime).toLocaleString()}</Text>
                <Text style={styles.itemStatus}>Status: {item.status}</Text>
            </View>
            <View style={styles.itemActions}>
                {/* Only allow update/delete for future/pending appointments */}
                {new Date(item.dateTime) > new Date() && item.status !== 'Completed' && (
                    <>
                        <Button title="Update" onPress={() => handleUpdate(item)} />
                        <View style={{ height: 5 }} />
                        <Button title="Cancel" color="red" onPress={() => handleDelete(item.id)} />
                    </>
                )}
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Appointments</Text>
            {appointments.length === 0 ? (
                <Text style={styles.emptyText}>You have no appointments.</Text>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    item: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemDetails: {
        flex: 1, // Take available space
        marginRight: 10,
    },
    itemService: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemDate: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    itemStatus: {
        fontSize: 14,
        color: '#007AFF', // Example color for status
        marginTop: 4,
        fontWeight: 'bold',
    },
    itemActions: {
        // Fixed width or let content decide
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    }
});

export default AppointmentListScreen;