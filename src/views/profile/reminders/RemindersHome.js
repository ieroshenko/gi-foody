import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Reminder from './Reminder';
import GeneralizedReminder from './GeneralizedReminder';

const Stack = createStackNavigator();

const RemindersHomeScreen = (props) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="List">
        {(navigationProps) => (
          <ReminderList data={props.data} {...navigationProps} />
        )}
      </Stack.Screen>
      <Stack.Screen name="add-new-after">
        {(navigationProps) => (
          <GeneralizedReminder
            data={props.data}
            {...navigationProps}
            type="after"
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="add-new-fixed">
        {(navigationProps) => (
          <GeneralizedReminder
            data={props.data}
            {...navigationProps}
            type="fixed"
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="existing">
        {(navigationProps) => <GeneralizedReminder {...navigationProps} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const ReminderList = (props) => {
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{flex: 1, backgroundColor: 'white'}}>
        {props.data.length ? (
          <FlatList
            contentContainerStyle={{
              backgroundColor: 'white',
            }}
            data={props.data}
            renderItem={({item}) => (
              <Reminder reminder={item} navigation={props.navigation} />
            )}
            keyExtractor={(item, index) => item.id}
            scrollEnabled={true}
            alwaysBounceVertical={true}
          />
        ) : (
          <Text>Empty. Add your first reminder!</Text>
        )}
      </View>
      <View style={styles.bottomBtnBar}>
        <Text style={styles.bottomBarTitle}>Add new</Text>
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => props.navigation.navigate('add-new-after')}>
          <Text style={styles.bottomBarText}>'after meal' reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => props.navigation.navigate('add-new-fixed')}>
          <Text style={styles.bottomBarText}>Fixed time reminder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RemindersHomeScreen;

const styles = StyleSheet.create({
  mainContainer: {flex: 1},
  bottomBtnBar: {
    width: '100%',
    height: 180,
    backgroundColor: 'white',
    bottom: 0,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderColor: '#d6d6d6',
  },
  bottomBarTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 13,
    marginTop: 13,
  },
  bottomBarBtn: {
    width: '90%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#7d8aff',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarText: {
    fontSize: 15,
    fontFamily: 'System',
    color: 'white',
    fontWeight: '600',
  },
});
