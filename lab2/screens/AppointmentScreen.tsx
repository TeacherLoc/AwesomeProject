// filepath: screens/Customer/AppointmentScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Platform } from 'react-native';
// You'll likely need a date/time picker library
import DateTimePicker from '@react-native-community/datetimepicker';

const AppointmentScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { serviceId, serviceName } = route.params || {}; // Get service info if navigated from details
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Placeholder for date change handling with a real picker
    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS until dismissed
        setDate(currentDate);
    };

    const handleBooking = () => {
        // --- Add API call to book appointment ---
        console.log('Booking:', {
            serviceId,
            serviceName,
            dateTime: date.toISOString(), // Send date in standard format
        });
        Alert.alert('Success', `Appointment for ${serviceName || 'service'} requested for ${date.toLocaleString()}.`);
        // Navigate to appointment list or back
        navigation.navigate('CustomerAppointmentList');
        // --- End API call ---
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Book Appointment</Text>
            {serviceName && <Text style={styles.serviceInfo}>Service: {serviceName}</Text>}

            <Text style={styles.label}>Select Date & Time:</Text>
            {/* Basic Button to trigger picker - Replace with actual DateTimePicker */}
            <Button onPress={() => setShowDatePicker(true)} title="Choose Date/Time" />
            <Text style={styles.dateText}>Selected: {date.toLocaleString()}</Text>

            {/* Example conditional rendering for a DateTimePicker */}
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="datetime" // Or 'date' / 'time'
                    {...(Platform.OS === 'android' ? { is24Hour: true } : {})}
                    display="default" // Or 'spinner', 'calendar', 'clock'
                    onChange={onDateChange}
                />
            )}

            <View style={styles.buttonContainer}>
                <Button title="Confirm Booking" onPress={handleBooking} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    serviceInfo: {
        fontSize: 18,
        marginBottom: 20,
        color: '#555',
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    dateText: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 30,
    },
    buttonContainer: {
        marginTop: 'auto', // Push button to the bottom
        width: '100%',
    }
});

export default AppointmentScreen;