import React, {useState, useEffect} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import SignUpAnonymousScreen from '../authentication/SignUpAnonymous';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from 'react-native-elements';
import SignInScreen from '../authentication/SignIn';
import {firebase} from '@react-native-firebase/auth';

const SettingsScreen = (props) => {
  const [isAnonymous, setIsAnonymous] = useState(false); //TODO: update the app's structure to pass this prop from App

  const signUserOut = () => {
    isAnonymous
      ? Alert.alert(
          'Cannot do this',
          'You are currently signed in anonymously. Please, sign up or sign in',
        )
      : firebase
          .auth()
          .signOut()
          .then(() => console.log('Signed out'));
  };

  return (
    <ScrollView>
      <View>
        <TouchableOpacity
          style={{backgroundColor: 'orange'}}
          onPress={signUserOut}>
          <Text>Log out, bitch!</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;
