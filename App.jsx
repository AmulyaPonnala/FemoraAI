import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Screen Imports
import HeaderScreen from './Component/HomeScreen';
import LoginScreen from './Component/LoginScreen';
import DoctorsScreen from './Component/DoctorsScreen';
import CartScreen from './Component/CartScreen';
import ProfileManagementScreen from './Component/ProfileManagementScreen';
import AppointmentSchedulePage from './Component/AppointmentSchedulePage';
import PrescriptionPage from './Component/PrescriptionPage';
import DoctorPage from './Component/DoctorPage';
import OnboardingScreens from './Component/OnboardingScreens';
import PeriodTrackerPage from './Component/PeriodTrackerPage';
import DoctorHomeScreen from './Component/DoctorHomepage';
import AddPrescriptionPage from './Component/AddPrescriptionPage';
import EducationalContent from './Component/EducationalContent';
// Context Providers
import { UserProvider, useUser } from './Component/context/UserContext';
import { CartProvider } from './Component/context/CartContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#E91E63" />
  </View>
);

// Home Stack Navigator
const HomeStack = () => {
  const { userData } = useUser();
  
  return (
    <Stack.Navigator 
      initialRouteName="HomeScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeScreen" component={HeaderScreen} />
      {!userData.isDoctor && (
        <Stack.Screen name="PeriodTracker" component={PeriodTrackerPage} />
      )}
      <Stack.Screen name="ProfileManagement" component={ProfileManagementScreen} />
    </Stack.Navigator>
  );
};

// Doctors Stack Navigator
const DoctorsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorsList" component={DoctorsScreen} />
      <Stack.Screen name="AppointmentSchedule" component={AppointmentSchedulePage} />
      <Stack.Screen name="pres" component={PrescriptionPage} />
      <Stack.Screen name="list" component={DoctorPage} />
    </Stack.Navigator>
  );
};

// Doctor Stack Navigator
const DoctorStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
      <Stack.Screen name="AddPrescription" component={AddPrescriptionPage} />
    </Stack.Navigator>
  );
};
const Edu = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Eduscreen" component={EducationalContent} />
    </Stack.Navigator>
  );
};
// Tab Navigator
const TabNavigator = () => {
  const { userData } = useUser();
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF3366',
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarLabelStyle: { display: 'none' },
        tabBarIconStyle: { marginBottom: -5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {!userData.isDoctor && (
        <Tab.Screen
          name="Doctors"
          component={DoctorsStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="medkit-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {!userData.isDoctor && (
        <Tab.Screen
          name="Edu"
          component={Edu}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="book-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {!userData.isDoctor && (
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="cart-outline" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Auth Navigator Component
const AuthNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { userData, login } = useUser();
  const { isLoggedIn, isDoctor, needsOnboarding } = userData;

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Call the login function from our unified context
        await login();
        setIsLoading(false);
      } catch (error) {
        console.error('Error in auth state change:', error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login]);

  if (isLoading) {
    return <LoadingScreen />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreens} />
      ) : isDoctor ? (
        <Stack.Screen name="DoctorStack" component={DoctorStack} />
      ) : (
        <Stack.Screen name="TabNavigator" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

// Main App Component
const App = () => {
  return (
    <UserProvider>
      <CartProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main" component={AuthNavigator} />
          </RootStack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </UserProvider>
  );
};

// Styles
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: '#FFE4EC',
    borderTopWidth: 0,
    elevation: 5,
    borderRadius: 20,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default App;