import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect, useState} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Journal from './views/journal/tracking_journal/Journal';
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
  const [newItemAdded, setNewItemAdded] = useState(false); // needed to tell tracking journal to load new meal item

  const addMealItemToJournal = () => {
    setNewItemAdded(!newItemAdded);
  };

  return (
    <bottomTab.Navigator
      initialRouteName="Journal"
      tabBarOptions={tabBarOptions}>
      <bottomTab.Screen
        name="Journal"
        options={{
          tabBarIcon: JournalIcon,
          tabBarLabel: 'Journal',
        }}>
        {() => <Journal newItemAdded={newItemAdded} />}
      </bottomTab.Screen>
      <bottomTab.Screen
        name="Snap"
        component={EmptyModalScreen}
        options={{
          tabBarIcon: SnapIcon,
          tabBarLabel: 'Snap',
          tabBarButton: (navProps) => (
            <CameraModalScreen
              {...navProps}
              reminders={props.reminders}
              combineMeals={props.combineMeals}
              symptoms={props.symptoms}
              addMealItemToJournal={addMealItemToJournal}
            />
          ),
        }}
      />
      <bottomTab.Screen
        name="Profile"
        options={{tabBarIcon: ProfileIcon, tabBarLabel: 'Profile'}}>
        {() => (
          <Profile
            isAnonymous={props.isAnonymous}
            symptoms={props.symptoms}
            unAnonymize={props.unAnonymize}
          />
        )}
      </bottomTab.Screen>
    </bottomTab.Navigator>
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
