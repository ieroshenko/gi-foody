import React, {useEffect, useState, useRef} from 'react';
import UserContext from './hooks/UserContext';
import {
  cancelNecessaryReminders,
  scheduleFixedReminders,
} from './services/LocalPushController';
import firebase from '@react-native-firebase/app';
import RemindersHomeScreen from './views/reminders/RemindersController';
import {createStackNavigator} from '@react-navigation/stack';
import Database from './wrappers/sqlite/SqliteFasade';
import MainTabs from './MainTabs';
import SettingsController from './views/settings/SettingsController';
import PushNotification from 'react-native-push-notification';
import NetInfo from '@react-native-community/netinfo';
import {handleOfflineImages} from './wrappers/firestore/FirebaseWrapper';
import {handleAnyQueuedCloudPicDeletions} from './wrappers/CloudStorageWrapper';
import NetInfoContext from './hooks/NetInfoContext';
import Statistics from './views/statistics/Statistics';
import * as RootNavigation from './hooks/RootNavigation';
import Orientation from 'react-native-orientation-locker';
import ScreenOrientation, {
  PORTRAIT,
} from 'react-native-orientation-locker/ScreenOrientation';
import FilterMealsController from './views/journal/filter_meals/FilterMealsController';

const Stack = createStackNavigator();

const ApplicationAfterSignIn = (props) => {
  const userID = React.useContext(UserContext);
  const [reminders, setReminders] = useState([]);
  const [combineMeals, setCombineMeals] = useState(20);
  const [symptoms, setSymptoms] = useState([]);
  const [isNetOnline, setIsNetOnline] = useState(true);
  const isFirstTime = useRef(true);
  const [orientation, setOrientation] = useState(
    Orientation.getInitialOrientation().replace('-', '_'),
  );

  const handleOrientationChange = (newOrientation) => {
    if (newOrientation.includes('LANDSCAPE')) {
      setOrientation(newOrientation.replace('-', '_'));
      openOrCloseStats(true);
    }
  };

  const openOrCloseStats = (open) => {
    open
      ? RootNavigation.navigate('statistics')
      : !isFirstTime.current && RootNavigation.goBack();

    // not first time anymore
    isFirstTime.current = false;
  };

  // add device orientation event listener
  useEffect(() => {
    Orientation.addDeviceOrientationListener(handleOrientationChange);

    return () =>
      Orientation.removeDeviceOrientationListener(handleOrientationChange);
  }, []);

  // Check for Notification permissions and request if necessary
  useEffect(() => {
    PushNotification.checkPermissions((perm) => {
      if (!perm.alert) {
        PushNotification.requestPermissions();
      }
    });
  }, []);

  // handle reminder scheduling
  useEffect(() => {
    if (userID !== '') {
      cancelNecessaryReminders(userID, reminders);
      scheduleFixedReminders(userID, reminders).then(() => {
        console.log('scheduled fixed reminders!');
      });
    }
  }, [reminders]);

  // add listeners to reminders
  useEffect(() => {
    if (userID !== '') {
      let unsubscribe = firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('reminders')
        .onSnapshot((querySnapshot) => {
          let newReminders = querySnapshot.docs.map((doc) => {
            let id = doc.id;
            Database.addReminder({id: id, isScheduled: false}).then(() => null);
            return {...doc.data(), id: doc.id};
          });

          setReminders(newReminders);
        });

      return () => unsubscribe();
    }
  }, [userID]);

  // get user's combine meal settings
  useEffect(() => {
    let unsubscribe = () => null;
    if (userID !== '' && userID !== null) {
      unsubscribe = firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .onSnapshot((queryDocSnapshot) => {
          if (queryDocSnapshot) {
            let userObj = queryDocSnapshot.data();
            // make sure it's not null
            if (userObj) {
              setCombineMeals(userObj.combineMeals);
            }
          }
        });
    }

    return () => unsubscribe;
  }, [userID]);

  useEffect(() => {
    // Get symptomSettings
    let unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('symptoms')
      .doc('userSymptoms')
      .onSnapshot((queryDocSnapshot) => {
        if (queryDocSnapshot && queryDocSnapshot.data()) {
          setSymptoms(queryDocSnapshot.data().availableSymptoms);
        }
      });

    return () => unsubscribe();
  }, [props.isAnonymous, userID]);

  useEffect(() => {
    // Add NetInfo
    const unsubscribe = NetInfo.addEventListener((state) => {
      let isNetOnline = state.isConnected && state.isInternetReachable;
      setIsNetOnline(isNetOnline);
      if (isNetOnline) {
        firebase.firestore().enableNetwork();
        handleOfflineImages(userID);
        handleAnyQueuedCloudPicDeletions(userID);
        //Alert.alert('Yay', 'inet is online');
      } else {
        firebase.firestore().disableNetwork();
        //Alert.alert('Nope', 'inet is offline');
      }
    });

    // Unsubscribe on component unmount
    return () => unsubscribe();
  }, [userID]);

  return (
    <NetInfoContext.Provider value={isNetOnline}>
      <ScreenOrientation orientation={PORTRAIT} />
      <Stack.Navigator
        screenOptions={{headerBackTitleVisible: false}}
        initialRouteName="Main Tabs">
        <Stack.Screen
          name="Main Tabs"
          options={{
            headerShown: false,
          }}>
          {() => (
            <MainTabs
              reminders={reminders}
              isAnonymous={props.isAnonymous}
              combineMeals={combineMeals}
              symptoms={symptoms}
              unAnonymize={props.unAnonymize}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Reminders" options={{headerShown: false}}>
          {() => <RemindersHomeScreen data={reminders} />}
        </Stack.Screen>
        <Stack.Screen name="Settings" options={{headerShown: false}}>
          {() => (
            <SettingsController
              isAnonymous={props.isAnonymous}
              combineMeals={combineMeals}
              email={props.email}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="filter" options={{headerShown: false}}>
          {() => <FilterMealsController symptoms={symptoms} />}
        </Stack.Screen>
        <Stack.Screen
          name="statistics"
          options={{headerShown: false, animationEnabled: false}}>
          {() => (
            <Statistics
              symptoms={symptoms}
              orientation={orientation}
              openOrCloseStats={openOrCloseStats}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NetInfoContext.Provider>
  );
};

export default ApplicationAfterSignIn;
