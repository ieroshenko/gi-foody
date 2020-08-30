import {sympColors} from '../../constants/SymptomColors';
import {Text, View, StyleSheet} from 'react-native';
import React from 'react';
import * as RNLocalize from 'react-native-localize';

const deviceTimeSettings = {
  deviceTimeZone: RNLocalize.getTimeZone(),
  uses24HourClock: RNLocalize.uses24HourClock(),
};

export const renderSymptom = ({item}) => {
  let sympID = item[0];
  let symptomValue = item[1];
  if (symptomValue === 0) {
    return null;
  }
  let itemColor = sympColors.get(symptomValue.toString());
  return (
    <View
      style={[
        styles.sympItemContainer,
        {
          backgroundColor: itemColor,
        },
      ]}>
      <Text style={styles.sympText}>
        {sympID} {''} {symptomValue}
      </Text>
    </View>
  );
};

/**
 * Get the title data of the meal in format (Month day at 00:00 (AM/PM))
 * using device's time settings (timezone, 24 hour or not and locale)
 * @param mealStarted: Firestore Timestamp of when meal started
 * @return {string}: (Month (short) day at 00:00 (AM/PM))
 */
export const getTitleDate = (mealDate) => {
  // Check if the meal was added today
  if (wasMealAddedToday(mealDate)) {
    return (
      'TODAY AT ' +
      mealDate.toLocaleTimeString([], {
        timeZone: deviceTimeSettings.deviceTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !deviceTimeSettings.uses24HourClock,
      })
    );
  } else {
    // Display the whole date of the meal
    // eslint-disable-next-line no-undef
    let formatter = new Intl.DateTimeFormat([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: deviceTimeSettings.deviceTimeZone,
      hour12: !deviceTimeSettings.uses24HourClock,
    });

    if (!deviceTimeSettings.uses24HourClock) {
      const [
        {value: month},
        ,
        {value: day},
        ,
        {value: hour},
        ,
        {value: minute},
        ,
        {value: dayPeriod},
      ] = formatter.formatToParts(mealDate);
      let monthUpper = month.toUpperCase();
      return `${day} ${monthUpper} AT ${hour}:${minute} ${dayPeriod}`;
    } else {
      // uses 24 hour clock
      const [
        {value: month},
        ,
        {value: day},
        ,
        {value: hour},
        ,
        {value: minute},
        ,
      ] = formatter.formatToParts(mealDate);
      let monthUpper = month.toUpperCase();
      return `${day} ${monthUpper} AT ${hour}:${minute}`;
    }
  }
};

/**
 * Checks if the meal was added today
 * @param mealDate
 * @return {boolean}: true if meal was added 'today', false otherwise
 */
export const wasMealAddedToday = (mealDate) => {
  // let currentTime = firebase.firestore.Timestamp.now().toDate();
  let currentTime = new Date();
  let ans;
  currentTime.getFullYear() === mealDate.getFullYear() &&
  currentTime.getMonth() === mealDate.getMonth() &&
  currentTime.getDate() === mealDate.getDate()
    ? (ans = true)
    : (ans = false);
  return ans;
};

const styles = StyleSheet.create({
  sympItemContainer: {
    width: '100%',
    height: 35,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sympText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
