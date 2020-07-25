import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import IntroScreen from './views/authentication/IntroScreen';
import {navigationRef} from './hooks/RootNavigation';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import auth, {firebase} from '@react-native-firebase/auth';
import SignUpScreen from './views/authentication/SignUp';
import SignInScreen from './views/authentication/SignIn';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RNFetchBlob from 'rn-fetch-blob';
import UserContext from './hooks/UserContext';
import Database from './Sqlite';
import ApplicationAfterSignIn from './ApplicationAfterSignIn';

const db = new Database();
const Stack = createStackNavigator();

const validateMetaData = async () => {
  try {
    // Iterate through every item
    AsyncStorage.getAllKeys((error, keys) => {
      keys.forEach((key) => {
        AsyncStorage.getItem(key).then((imgID) => {
          // Check if the image exists in cache
          // If not -> delete from AsyncStorage
          RNFetchBlob.fs
            .exists(`${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`)
            .then((exists) => {
              if (!exists) {
                AsyncStorage.removeItem(key);
              }
            })
            .catch((error) => {
              if (error) {
                console.log(error);
              }
            });
        });
      });
    });
  } catch (e) {
    console.log(e);
  }
};

const App = (props) => {
  const [isSignedIn, setIsSignedIn] = useState(
    firebase.auth().currentUser ? true : false,
  );
  const [userID, setUserID] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  db.initDB();

  useEffect(
    () => {
      let unsubscribeFcn = firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          setIsSignedIn(true);
          setUserID(user.uid);
          setIsAnonymous(user.isAnonymous);
        } else {
          // User is signed out.
          setIsSignedIn(false);
          setUserID('');
        }
      });

      // Clean Async Storage to make sure all metadata is valid
      validateMetaData().then(() => console.log('Validated that shit!'));

      // Specify how to clean up after this effect:
      return () => unsubscribeFcn();
    },
    // Empty Array to make sure fcn doesn't get called every time
    [],
  );

  return (
    <SafeAreaProvider>
      <UserContext.Provider value={userID}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator gestureEnabled={false}>
            {isSignedIn ? (
              <Stack.Screen
                name="Main"
                options={{headerShown: false}}
                initialParams={{isAnonymous}}>
                {() => <ApplicationAfterSignIn isAnonymous={isAnonymous} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen
                  name="IntroScreen"
                  component={IntroScreen}
                  options={{headerShown: false}}
                />
                <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
                <Stack.Screen name="Sign In" component={SignInScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </UserContext.Provider>
    </SafeAreaProvider>
  );
};

export default App;
