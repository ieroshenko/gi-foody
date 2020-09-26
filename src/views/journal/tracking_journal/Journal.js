import {StatusBar, TouchableOpacity, View} from 'react-native';
import {Icon} from 'react-native-elements';
import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ItemList from './TrackingJournal';

const Stack = createStackNavigator();

const FilterHeaderLeft = (props) => {
  return (
    <View style={{marginLeft: 15}}>
      <TouchableOpacity onPress={() => props.openFilter()}>
        <Icon name="search" size={25} />
      </TouchableOpacity>
    </View>
  );
};

const NotificationHeaderRight = (props) => {
  return (
    <View
      style={{
        marginRight: 15,
      }}>
      <TouchableOpacity onPress={() => props.openReminders()}>
        <Icon name="notifications" />
      </TouchableOpacity>
    </View>
  );
};

const Journal = (props) => {
  const openReminders = (navigation) => {
    navigation.navigate('Main', {screen: 'Reminders'});
  };

  const openFilterMeals = (navigation) => {
    navigation.navigate('Main', {screen: 'filter'});
  };

  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator>
        <Stack.Screen
          name="Journal"
          options={({navigation}) => ({
            title: '',
            headerRight: () => (
              <NotificationHeaderRight
                openReminders={() => openReminders(navigation)}
              />
            ),
            headerLeft: () => (
              <FilterHeaderLeft
                openFilter={() => openFilterMeals(navigation)}
              />
            ),
          })}>
          {() => <ItemList newItemAdded={props.newItemAdded} />}
        </Stack.Screen>
      </Stack.Navigator>
    </View>
  );
};

export default Journal;
