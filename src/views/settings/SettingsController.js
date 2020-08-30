import React, {useState, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SettingsHome from './SettingsHome';
import CombineMealsSettings from './CombineMeals';
import PasswordReset from './PasswordReset';
import LinkMultiple from './LinkMultiple';

const Stack = createStackNavigator();

const SettingsController = (props) => {
  return (
    <Stack.Navigator screenOptions={{headerBackTitleVisible: false}}>
      <Stack.Screen name="home" options={{title: 'Settings'}}>
        {(navigationProps) => (
          <SettingsHome
            isAnonymous={props.isAnonymous}
            combineMeals={props.combineMeals}
            navigationProps={navigationProps}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="combine-meals" options={{title: null}}>
        {(navigationProps) => (
          <CombineMealsSettings
            combineMeals={props.combineMeals}
            navigationProps={navigationProps}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="reset-password" options={{title: 'Reset password'}}>
        {(navigationProps) => (
          <PasswordReset {...navigationProps} email={props.email} />
        )}
      </Stack.Screen>
      <Stack.Screen name="link-multiple" options={{headerShown: false}}>
        {(navigationProps) => (
          <LinkMultiple {...navigationProps} email={props.email} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default SettingsController;
