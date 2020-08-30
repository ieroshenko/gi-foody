import React from 'react';
import {View, StatusBar, TouchableOpacity} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {Icon} from 'react-native-elements';
import ProfileContent from './ProfileContent';

const Stack = createStackNavigator();

const Profile = (props) => {
  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{headerBackTitleVisible: false}}>
        <Stack.Screen
          name="Profile"
          options={({navigation}) => ({
            title: '',
            headerLeft: (props) => (
              <HeaderLeft {...props} navigation={navigation} />
            ),
          })}>
          {() => (
            <ProfileContent
              isAnonymous={props.isAnonymous}
              symptoms={props.symptoms}
              unAnonymize={props.unAnonymize}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </View>
  );
};

const HeaderLeft = (props) => {
  const openSettings = () => {
    props.navigation.navigate('Main', {screen: 'Settings'});
  };

  return (
    <TouchableOpacity style={{marginLeft: 15}} onPress={openSettings}>
      <Icon name="settings" />
    </TouchableOpacity>
  );
};

export default Profile;
