import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ReminderFirestore from '../../../wrappers/RemindersDBManagement';
import UserContext from '../../../hooks/UserContext';

const GeneralizedReminder = (props) => {
  const userID = React.useContext(UserContext);
  const mode = 'time';
  const isNew = props.type ? true : false; // Identify if we want to create a new item or not
  const type = isNew ? props.type : props.route.params.reminder.type;

  const [isEnabled, setIsEnabled] = useState(
    isNew ? false : props.route.params.reminder.isActive,
  );
  const [message, setMessage] = useState(
    isNew ? '' : props.route.params.reminder.message,
  );
  const [time, setTime] = useState(
    isNew
      ? new Date('August 19, 1999 00:00')
      : new Date(`August 19, 1999 ${props.route.params.reminder.time}`),
  );
  const [showOnAndroid, setShowOnAndroid] = useState(false);

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  const formatAMPM = () => {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  };

  const handleSave = () => {
    let selectedHours = `${time.getHours()}`;
    let selectedMinutes = `${time.getMinutes()}`;

    let selectedTime =
      type === 'after'
        ? `${selectedHours}:${selectedMinutes}`
        : `${formatAMPM()}`;

    if (type === 'after' && selectedHours === '0' && selectedMinutes === '0') {
      Alert.alert(
        'Time of the reminder is missing',
        "Don't forget to specify the time of the reminder",
      );

      return;
    }

    // Identify if we need to add a new one or update existing one since component is generalized
    props.type
      ? ReminderFirestore.addReminderToDB(
          isEnabled,
          message,
          selectedTime,
          type,
          userID,
          props.data,
        )
      : ReminderFirestore.updateReminderDB(
          isEnabled,
          message,
          selectedTime,
          type,
          userID,
          props.route.params.reminder.id,
        );

    // go to previous screen
    props.navigation.navigate('List');
  };

  const deleteReminder = () => {
    ReminderFirestore.deleteReminderDB(userID, props.route.params.reminder.id);
    // go to previous screen
    props.navigation.navigate('List');
  };

  const outputDateTimePicker = () => {
    if (
      type === 'after' &&
      (Platform.OS === 'ios' || (Platform.OS === 'android' && showOnAndroid))
    ) {
      return (
        <DateTimePicker
          display="spinner"
          value={time}
          mode={mode}
          is24Hour={true}
          locale="en_GB"
          onChange={handleTimePickerOnChange}
        />
      );
    } else if (
      type === 'fixed' &&
      (Platform.OS === 'ios' || (Platform.OS === 'android' && showOnAndroid))
    ) {
      return (
        <DateTimePicker
          display="spinner"
          value={time}
          mode={mode}
          onChange={handleTimePickerOnChange}
        />
      );
    }

    return null;
  };

  const handleTimePickerOnChange = (event, date) => {
    if (Platform.OS === 'ios') {
      setTime(date);
    } else {
      // Android
      if (event.type !== 'dismissed') {
        setTime(date);
        setShowOnAndroid(false);
      }
      setShowOnAndroid(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.container}>
        <View style={styles.activeSelectorText}>
          <Text style={styles.label}>Active</Text>
          <Switch onValueChange={toggleSwitch} value={isEnabled} />
        </View>
        <View style={styles.secondLabelContainer}>
          <Text style={styles.label}>
            {type === 'after'
              ? 'When would you like to get a reminder after a meal?'
              : 'When would you like to get a reminder?'}
          </Text>
          {Platform.OS === 'android' && (
            <>
              <TouchableOpacity
                style={styles.openSelectorBtn}
                onPress={() => setShowOnAndroid(true)}>
                <Text style={[styles.btnTxt, {color: 'black'}]}>
                  Open time selector
                </Text>
              </TouchableOpacity>
            </>
          )}
          {outputDateTimePicker()}
        </View>
        <TextInput
          style={styles.messageInput}
          onChangeText={(text) => setMessage(text)}
          blurOnSubmit={true}
          placeholder="Message"
          value={message}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnTxt}>Save</Text>
        </TouchableOpacity>
        {isNew ? null : (
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteReminder}>
            <Text style={styles.btnTxt}>Delete reminder</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default GeneralizedReminder;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white', alignItems: 'center'},
  activeSelectorText: {
    flexDirection: 'row',
    width: '95%',
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: '#d6d6d6',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondLabelContainer: {
    width: '95%',
    padding: 10,
  },
  openSelectorBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#7dff7d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 12,
    alignSelf: 'center',
  },
  saveBtn: {
    width: '90%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#7d8aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnTxt: {
    fontSize: 17,
    fontFamily: 'System',
    color: 'white',
    fontWeight: '600',
  },
  deleteBtn: {
    width: '90%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#ff7d7d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    width: '95%',
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: '#d6d6d6',
    marginBottom: 20,
    fontSize: 17,
  },
  label: {
    fontSize: 17,
    fontFamily: 'System',
  },
});
