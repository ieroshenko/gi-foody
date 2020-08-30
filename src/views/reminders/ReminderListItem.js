import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import React from 'react';

const ReminderListItem = (props) => {
  let reminderTimeText = '';

  if (props.reminder.type === 'after') {
    let [hours, minutes] = props.reminder.time.split(':');
    if (hours === '0') {
      reminderTimeText = `${minutes} minutes after meal`;
    } else if (hours === '1') {
      let minutesVerified = minutes === '0' ? '' : `${minutes} minutes `;
      reminderTimeText = `${hours} hour ${minutesVerified}after meal`;
    } else if (minutes === '0') {
      reminderTimeText = `${hours} hours after meal`;
    } else {
      reminderTimeText = `${hours} hours ${minutes} minutes after meal`;
    }
  } else {
    reminderTimeText = props.reminder.time;
  }

  return (
    <TouchableOpacity
      style={styles.mainButton}
      onPress={() =>
        props.navigation.navigate('existing', {reminder: props.reminder})
      }>
      <View style={styles.contentContainer}>
        <View style={styles.reminderInfoTextContainer}>
          <Text style={styles.reminderTitle}>{reminderTimeText}</Text>
          <Text style={styles.message}>{props.reminder.message}</Text>
        </View>
        <Text style={styles.arrowIcon}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ReminderListItem;

const styles = StyleSheet.create({
  mainButton: {
    borderBottomWidth: 0.5,
    borderColor: '#c2c2c2',
    padding: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  reminderInfoTextContainer: {
    width: '85%',
  },
  reminderTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    width: '100%',
    color: 'gray',
  },
  arrowIcon: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    alignSelf: 'center',
    color: '#7d8aff',
  },
});
