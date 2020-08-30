import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReminderListItem from './ReminderListItem';
import React, {useEffect} from 'react';
import PushNotification from 'react-native-push-notification';
import {deactivateAllReminders} from '../../services/LocalPushController';

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
              <ReminderListItem reminder={item} navigation={props.navigation} />
            )}
            keyExtractor={(item, index) => item.id}
            scrollEnabled={true}
            alwaysBounceVertical={true}
          />
        ) : (
          <View style={styles.emptyDataContainer}>
            <Text style={styles.emptyDataTitle}>Add your first reminder!</Text>
            <Text style={styles.emptyDataText}>
              Click on one of the buttons below to do so.
            </Text>
          </View>
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

export default ReminderList;

const styles = StyleSheet.create({
  mainContainer: {flex: 1, backgroundColor: 'white'},
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
  emptyDataContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 40,
    marginTop: 150,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  emptyDataTitle: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 18,
    marginBottom: 10,
    color: '#7d8aff',
    textAlign: 'center',
  },
  emptyDataText: {
    fontFamily: 'System',
    fontSize: 16,
    textAlign: 'center',
  },
});
