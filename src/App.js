import React, {useEffect, useState} from 'react';
import IntroScreen from './views/authentication/IntroScreen';
import {navigationRef, isReadyRef} from './hooks/RootNavigation';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import auth, {firebase} from '@react-native-firebase/auth';
import SignUpScreen from './views/authentication/SignUp';
import SignInScreen from './views/authentication/SignIn';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RNFetchBlob from 'rn-fetch-blob';
import UserContext from './hooks/UserContext';
import ApplicationAfterSignIn from './ApplicationAfterSignIn';
import Database from './wrappers/sqlite/SqliteFasade';
import AppIntroSlider from 'react-native-app-intro-slider';
import IntroSlide from './views/intro_slides/IntroSlide';
import ScreenOrientation, {
  PORTRAIT,
} from 'react-native-orientation-locker/ScreenOrientation';
import * as Sentry from '@sentry/react-native';
import SplashScreen from 'react-native-splash-screen';

Sentry.init({
  dsn:
    'https://687ba7eaaf8446b9bbce657a49ba79bd@o433934.ingest.sentry.io/5390132',
});

const slides = [
  {
    key: 1,
    title: 'Track',
    text: 'Track what you eat\nor drink',
    image: require('../img/TrackMeals.jpg'),
    backgroundColor: '#f5a142',
  },
  {
    key: 2,
    title: 'Record',
    text: 'Record your symptoms after meal',
    image: require('../img/record_symptoms.jpg'),
    backgroundColor: '#f5a142',
  },
  {
    key: 3,
    title: 'Search',
    text: 'Filter meals by symptom values',
    image: require('../img/filter_meals.jpg'),
    backgroundColor: '#7d8aff',
  },
  {
    key: 4,
    title: 'Analyze',
    text: 'Rotate phone to look up symptom trends',
    image: require('../img/statistics.jpg'),
    backgroundColor: '#7d8aff',
  },
  {
    key: 5,
    title: 'Customize',
    text: 'Add your own symptoms to track',
    image: require('../img/customize.png'),
    backgroundColor: '#6ee06e',
  },
];

const Stack = createStackNavigator();

const App = (props) => {
  const [isSignedIn, setIsSignedIn] = useState(
    firebase.auth().currentUser ? true : false,
  );
  const [userID, setUserID] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  /**
   * Update user's account info (isAnonymous) manually, because of potential bug
   * with onAuthStateChanged listener and linkWithCredential fcns of firebase
   */
  const updateIsAnonymousToFalse = () => {
    setIsAnonymous(false);
  };

  //hide splashscreen
  useEffect(() => {
    try {
      SplashScreen.hide();
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(
    () => {
      isReadyRef.current = false;

      try {
        // Create image cache folder
        RNFetchBlob.fs
          .mkdir(`${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`)
          .then(() => console.log('Created the dir'))
          .catch((e) => {
            if (e) {
              console.log('Image cache folder already exists');
            }
          });
      } catch (e) {
        // already exists
        console.log('Image cache folder already exists');
      }

      let unsubscribeFcn = () => null;

      Database.initDB().then(() => {
        unsubscribeFcn = firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in.
            Database.checkIfUserExists(user.uid).then((sqlUser) => {
              if (sqlUser) {
                let firstTime = sqlUser.isFirstTime === 1;
                setIsFirstTime(firstTime);
              } else {
                Database.addNewUser(user.uid);
                setIsFirstTime(true);
              }

              setIsSignedIn(true);
              setUserID(user.uid);
              setIsAnonymous(user.isAnonymous);
              setEmail(user.email);
            });
          } else {
            // User is signed out.
            setIsSignedIn(false);
            setUserID('');
          }
        });
      });

      // Specify how to clean up after this effect:
      return () => unsubscribeFcn();
    },
    // Empty Array to make sure fcn doesn't get called every time
    [],
  );

  const closeIntroSlides = () => {
    Database.updateUserFirstTimeStatus(userID, false);
    setIsFirstTime(false);
  };

  return (
    <SafeAreaProvider>
      {/*<View*/}
      {/*  style={{*/}
      {/*    flexDirection: 'row',*/}
      {/*    justifyContent: 'space-between',*/}
      {/*    marginTop: 60,*/}
      {/*  }}>*/}
      {/*  <TouchableOpacity onPress={() => Database.getAllMeals(userID)}>*/}
      {/*    <Text>Get all meals sqldb</Text>*/}
      {/*  </TouchableOpacity>*/}
      {/*  <TouchableOpacity onPress={() => Database.getAllMealSymptoms(userID)}>*/}
      {/*    <Text>Get all meal symps</Text>*/}
      {/*  </TouchableOpacity>*/}
      {/*<TouchableOpacity onPress={() => Database.deleteAllMeals()}>*/}
      {/*  <Text>Delete all meal related data</Text>*/}
      {/*</TouchableOpacity>*/}
      {/*</View>*/}
      <ScreenOrientation orientation={PORTRAIT} />
      <UserContext.Provider value={userID}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => (isReadyRef.current = true)}>
          <Stack.Navigator
            gestureEnabled={false}
            screenOptions={{headerBackTitleVisible: false}}>
            {isFirstTime ? (
              <Stack.Screen name="Guide" options={{headerShown: false}}>
                {() => (
                  <AppIntroSlider
                    data={slides}
                    renderItem={({item}) => <IntroSlide slide={item} />}
                    onDone={closeIntroSlides}
                    keyExtractor={(item) => item.key.toString()}
                  />
                )}
              </Stack.Screen>
            ) : isSignedIn ? (
              <Stack.Screen
                name="Main"
                options={{headerShown: false}}
                initialParams={{isAnonymous}}>
                {() => (
                  <ApplicationAfterSignIn
                    isAnonymous={isAnonymous}
                    email={email}
                    unAnonymize={updateIsAnonymousToFalse}
                  />
                )}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen
                  name="IntroScreen"
                  component={IntroScreen}
                  options={{headerShown: false}}
                />
                <Stack.Screen
                  name="SignUpScreen"
                  component={SignUpScreen}
                  options={{title: null}}
                />
                <Stack.Screen
                  name="Sign In"
                  component={SignInScreen}
                  options={{title: null}}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </UserContext.Provider>
    </SafeAreaProvider>
  );
};

export default App;
