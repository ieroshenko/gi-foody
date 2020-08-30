import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import GeneralizedReminder from './GeneralizedReminder';
import ReminderList from './RemindersList';
import PushNotification from 'react-native-push-notification';
import {deactivateAllReminders} from '../../services/LocalPushController';
import UserContext from '../../hooks/UserContext';

const Stack = createStackNavigator();

const RemindersController = (props) => {
  const userID = React.useContext(UserContext);

  useEffect(() => {
    PushNotification.checkPermissions((perm) => {
      if (!perm.alert) {
        deactivateAllReminders(userID);
      }
    });
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen name="List" options={{headerTitle: 'Reminders'}}>
        {(navigationProps) => (
          <ReminderList data={props.data} {...navigationProps} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="add-new-after"
        options={{
          headerTitle: '',
        }}>
        {(navigationProps) => (
          <GeneralizedReminder
            data={props.data}
            {...navigationProps}
            type="after"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="add-new-fixed"
        options={{
          headerTitle: '',
        }}>
        {(navigationProps) => (
          <GeneralizedReminder
            data={props.data}
            {...navigationProps}
            type="fixed"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="existing"
        options={{
          headerTitle: '',
        }}>
        {(navigationProps) => <GeneralizedReminder {...navigationProps} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RemindersController;
