import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect, useState} from 'react';
import UserContext from './hooks/UserContext';
import NetInfo from '@react-native-community/netinfo';
import {firebase} from '@react-native-firebase/auth';
import {handleOfflineImages} from './wrappers/FirebaseWrapper';
import {handleAnyQueuedCloudPicDeletions} from './wrappers/CloudStorageWrapper';
import NetInfoContext from './hooks/NetInfoContext';
import {Dimensions, StyleSheet} from 'react-native';
import Journal from './views/journal/Journal';
import {CameraModalScreen} from './views/adding_meals/AddNewController';
import Profile from './views/profile/ProfileView';
import {Icon} from 'react-native-elements';

const bottomTab = createBottomTabNavigator();

const JournalIcon = ({focused, color}) => {
  return <Icon name="book" color={color} />;
};

const SnapIcon = ({focused, color}) => {
  return <Icon name="panorama-fish-eye" color={color} />;
};

const ProfileIcon = ({focused, color}) => {
  return <Icon name="person" color={color} />;
};

const EmptyModalScreen = () => {
  return null;
};

const MainTabs = (props) => {
  const userID = React.useContext(UserContext);
  const [isNetOnline, setIsNetOnline] = useState(true);

  console.log(props.isAnonymous);

  useEffect(() => {
    // Add NetInfo
    const unsubscribe = NetInfo.addEventListener((state) => {
      let isNetOnline = state.isConnected && state.isInternetReachable;
      if (isNetOnline) {
        firebase.firestore().enableNetwork();
        handleOfflineImages(userID);
        handleAnyQueuedCloudPicDeletions(userID);
        //Alert.alert('Yay', 'inet is online');
      } else {
        firebase.firestore().disableNetwork();
        //Alert.alert('Nope', 'inet is offline');
      }
      setIsNetOnline(isNetOnline);
    });

    // Unsubscribe on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <NetInfoContext.Provider value={isNetOnline}>
      <bottomTab.Navigator
        initialRouteName="Journal"
        tabBarOptions={tabBarOptions}>
        <bottomTab.Screen
          name="Journal"
          options={{
            tabBarIcon: JournalIcon,
            tabBarLabel: 'Journal',
          }}
          component={Journal}
        />
        <bottomTab.Screen
          name="Snap"
          component={EmptyModalScreen}
          options={{
            tabBarIcon: SnapIcon,
            tabBarLabel: 'Snap',
            tabBarButton: (navProps) => (
              <CameraModalScreen {...navProps} reminders={props.reminders} />
            ),
          }}
        />
        <bottomTab.Screen
          name="Profile"
          options={{tabBarIcon: ProfileIcon, tabBarLabel: 'Profile'}}>
          {() => <Profile isAnonymous={props.isAnonymous} />}
        </bottomTab.Screen>
      </bottomTab.Navigator>
    </NetInfoContext.Provider>
  );
};

export default MainTabs;

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: 'System',
    textTransform: 'none',
    fontWeight: '600',
  },
  iconStyle: {alignSelf: 'center', justifyContent: 'flex-end'},
  navStyle: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
});

const tabBarOptions = {
  initialLayout: {width: Dimensions.get('window').width},
  showIcon: true,
  showLabel: true,
  indicatorStyle: {backgroundColor: 'transparent'},
  activeTintColor: '#FFA500',
  inactiveTintColor: 'gray',
  pressOpacity: 100,
  labelStyle: styles.label,
  iconStyle: styles.iconStyle,
  style: styles.navStyle,
};
