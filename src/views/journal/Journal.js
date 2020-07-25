import {StatusBar, TouchableOpacity, View} from 'react-native';
import {Icon} from 'react-native-elements';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ItemList from './TrackingJournal';

const Stack = createStackNavigator();

const NotificationHeaderRight = (props) => {
  return (
    <View style={{marginRight: 15}}>
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

  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator>
        <Stack.Screen
          name="Journal"
          component={ItemList}
          options={({navigation}) => ({
            title: '',
            headerRight: () => (
              <NotificationHeaderRight
                openReminders={() => openReminders(navigation)}
              />
            ),
          })}
        />
      </Stack.Navigator>
    </View>
  );
};

export default Journal;
