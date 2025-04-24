import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabNavigator from './MainTabNavigator';
import { NavigationContainer } from '@react-navigation/native';

const Drawer = createDrawerNavigator();

const MainDrawerNavigator = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={MainTabNavigator} />
        {/* Add more screens to the drawer as needed */}
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default MainDrawerNavigator;