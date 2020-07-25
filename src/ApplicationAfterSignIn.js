import React, {useEffect, useState} from 'react';
import UserContext from './hooks/UserContext';
import {
  cancelNecessaryReminders,
  scheduleFixedReminders,
} from './services/LocalPushController';
import {firebase} from '@react-native-firebase/auth';
import RemindersHomeScreen from './views/profile/reminders/RemindersHome';
import {createStackNavigator} from '@react-navigation/stack';
import Database from './Sqlite';
import MainTabs from './MainTabs';

const Stack = createStackNavigator();
const db = new Database();

const ApplicationAfterSignIn = (props) => {
  const userID = React.useContext(UserContext);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    cancelNecessaryReminders(userID, reminders);
    scheduleFixedReminders(userID, reminders).then(() => {
      console.log('schedule fixed ones!');
    });
  }, [reminders]);

  useEffect(() => {
    let unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('reminders')
      .onSnapshot((querySnapshot) => {
        let newReminders = querySnapshot.docs.map((doc) => {
          let id = doc.id;
          db.addReminder({id: id, isScheduled: false}).then(() =>
            console.log('Added or (ignored if exists) to MySQL'),
          );
          return {...doc.data(), id: doc.id};
        });

        setReminders(newReminders);
      });

    return () => unsubscribe();
  }, [userID]);

  return (
    <Stack.Navigator>
      <Stack.Screen name="Main Tabs" options={{headerShown: false}}>
        {() => (
          <MainTabs reminders={reminders} isAnonymous={props.isAnonymous} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Reminders" options={{headerShown: false}}>
        {() => <RemindersHomeScreen data={reminders} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default ApplicationAfterSignIn;
