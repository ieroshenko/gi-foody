import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import firebase from '@react-native-firebase/app';
import LinkEmail from './LinkEmail';
import LinkFacebook from './LinkFacebook';
import LinkApple from './LinkApple';
import {stat} from 'react-native-fs';

const Stack = createStackNavigator();

const LinkMultipleController = (props) => {
  const [isEmailLinked, setIsEmailLinked] = useState(false);
  const [isFbLinked, setIsFbLinked] = useState(false);
  const [isAppleLinked, setIsAppleLinked] = useState(false);

  let canBeUnlinked: boolean = () => {
    let numAccLinked = 0;

    if (isEmailLinked) {
      numAccLinked++;
    }
    if (isFbLinked) {
      numAccLinked++;
    }
    if (isAppleLinked) {
      numAccLinked++;
    }

    return numAccLinked > 1;
  };

  const updateFbLinkedStatus = (status) => {
    setIsFbLinked(status);
  };

  const updateEmailLinkedStatus = (status) => {
    setIsEmailLinked(status);
  };

  const updateAppleLinkedStatus = (status) => {
    setIsAppleLinked(status);
  };

  // get initially linked providers
  useEffect(() => {
    let user = firebase.auth().currentUser;

    user.providerData.forEach((provider) => {
      if (provider.providerId === 'password') {
        setIsEmailLinked(true);
      } else if (provider.providerId === 'facebook.com') {
        setIsFbLinked(true);
      } else if (provider.providerId === 'apple.com') {
        setIsAppleLinked(true);
      }
    });
  }, []);

  return (
    <Stack.Navigator screenOptions={{headerBackTitleVisible: false}}>
      <Stack.Screen name="link-home" options={{title: null}}>
        {(navigationProps) => <LinkMultipleHome {...navigationProps} />}
      </Stack.Screen>
      <Stack.Screen name="link-email" options={{title: 'Link Email'}}>
        {() => (
          <LinkEmail
            isLinked={isEmailLinked}
            updateLinkedStatus={updateEmailLinkedStatus}
            canUnlink={canBeUnlinked}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="link-fb" options={{title: 'Link Facebook'}}>
        {() => (
          <LinkFacebook
            isLinked={isFbLinked}
            updateLinkedStatus={updateFbLinkedStatus}
            canUnlink={canBeUnlinked}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="link-apple" options={{title: 'Link Apple'}}>
        {() => (
          <LinkApple
            isLinked={isAppleLinked}
            updateLinkedStatus={updateAppleLinkedStatus}
            canUnlink={canBeUnlinked}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default LinkMultipleController;

const LinkMultipleHome = (props) => {
  return (
    <ScrollView
      style={{backgroundColor: 'white'}}
      contentContainerStyle={styles.container}>
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => props.navigation.navigate('link-email')}>
          <Text style={styles.menuTxt}>Link your Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => props.navigation.navigate('link-fb')}>
          <Text style={styles.menuTxt}>Link with Facebook</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => props.navigation.navigate('link-apple')}>
            <Text style={styles.menuTxt}>Link with Apple</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sectionContainer: {width: '92%', marginTop: 30},
  menuBtn: {
    paddingTop: 17,
    paddingBottom: 17,
    borderBottomWidth: 0.5,
    borderColor: '#d1d1d1',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  menuTxt: {
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'System',
  },
});
