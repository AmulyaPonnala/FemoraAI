import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeetingTimeModal } from './MeetingTimeModal';
import { auth ,db } from '../firebase.config'; // Adjust the import path as necessary
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AppointmentCard = ({ appointment, isUpcoming }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleReschedule = () => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#E8F5E9', text: '#4CAF50', icon: 'checkmark-circle' };
      case 'Pending':
        return { bg: '#FFF3E0', text: '#FF9800', icon: 'time' };
      case 'Completed':
        return { bg: '#E3F2FD', text: '#2196F3', icon: 'checkbox' };
      case 'Cancelled':
        return { bg: '#FFEBEE', text: '#F44336', icon: 'close-circle' };
      default:
        return { bg: '#E8F5E9', text: '#4CAF50', icon: 'checkmark-circle' };
    }
  };

  const statusStyle = getStatusColor(appointment.status);

  const renderButtons = () => {
    if (!isUpcoming) return null;

    if (appointment.status === 'Pending' || appointment.status === 'Confirmed') {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.rescheduleButton, styles.fullWidthButton]}
            onPress={() => Linking.openURL(appointment.joinLink)}
          >
            <Text style={styles.rescheduleButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: appointment.image }}
          style={styles.doctorImage}
        />
        <View style={styles.appointmentInfo}>
          <Text style={styles.doctorName}>{appointment.doctorName}</Text>
          <Text style={styles.doctorSpecialty}>{appointment.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{appointment.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
      <View style={styles.detailRow}>
  <View style={styles.detailItem}>
    <Ionicons name="calendar-outline" size={18} color="#E91E63" />
    <Text style={styles.detailText}>
      {appointment.date || "No date available"}
    </Text>
  </View>
  <View style={styles.detailItem}>
    <Ionicons name="time-outline" size={18} color="#E91E63" />
    <Text style={styles.detailText}>
      {appointment.time || "No time available"}
    </Text>
  </View>
</View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={16} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{appointment.status}</Text>
          </View>
        </View>
      </View>

      {renderButtons()}
    </View>
  );
};

const AppointmentSchedulePage = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {

    const userId = auth.currentUser?.uid;
      
      setLoading(true);
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId)); // Replace with actual user ID
      const querySnapshot = await getDocs(q);

      const appointmentsData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const bookingData = docSnapshot.data();
        const doctorRef = doc(db, 'doctors', bookingData.doctorId);
        const doctorSnap = await getDoc(doctorRef);

        if (doctorSnap.exists()) {
          const doctorData = doctorSnap.data();
          appointmentsData.push({
            id: docSnapshot.id,
            ...bookingData,
            doctorName: doctorData.name,
            specialty: doctorData.specialty,
            rating: doctorData.rating,
            reviews: doctorData.reviews,
            image: doctorData.profileImage,
          });
        }
      }

      setAppointments(appointmentsData);
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(appointment => 
    activeTab === 'upcoming' ? appointment.status !== 'Completed' && appointment.status !== 'Cancelled' : appointment.status === 'Completed' || appointment.status === 'Cancelled'
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#E91E63" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color="transparent"/>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>
        
      {/* Appointment Cards */}
      <ScrollView style={styles.cardsContainer}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <AppointmentCard 
              key={appointment.id}
              appointment={appointment}
              isUpcoming={activeTab === 'upcoming'}
            />
          ))
        ) : (
          <View style={styles.emptyStateContainer}>

            <Text style={styles.emptyStateText}>
              {activeTab === 'upcoming' 
                ? "Book a meeting and start your journey! 🌟" 
                : "Your past meetings will be shown here. 📚"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D3A',
  },
  backButton: {
    padding: 8,
  },
  calendarButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    borderRadius: 24,
    backgroundColor: '#FFE4EC',
  },
  activeTab: {
    backgroundColor: '#E91E63',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E91E63',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  cardsContainer: {
    flex: 1,
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  doctorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#8F90A6',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8F90A6',
  },
  appointmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#FFE4EC',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D2D3A',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFE4EC',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#E91E63',
    fontWeight: '600',
    fontSize: 15,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#E91E63',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  fullWidthButton: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8F90A6',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AppointmentSchedulePage;