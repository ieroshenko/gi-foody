import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import UserContext from '../../hooks/UserContext';
import firebase from '@react-native-firebase/app';

const convertMinToHours = (minutes) => {
  let hours = minutes % 60;
  let newMins = minutes - hours * 60;

  return [hours, newMins];
};

const CombineMealsSettings = (props) => {
  // convert num mintes to hours and minutes
  const [hours, minutes] = convertMinToHours(props.combineMeals);
  const userID = React.useContext(UserContext);

  const [time, setTime] = useState(new Date(1999, 7, 19, hours, minutes));
  const [showOnAndroid, setShowOnAndroid] = useState(false);

  const handleSave = () => {
    let selectedHours = time.getHours();
    let selectedMinutes = time.getMinutes();

    let minutes = selectedHours * 60 + selectedMinutes;

    if (minutes === 0) {
      Alert.alert("Timeframe can't be 0", "Don't forget to specify the time");
      return;
    } else {
      firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .update({combineMeals: minutes})
        .then(() => console.log('Updated combine setting'));
    }

    // navigate back to settings
    props.navigationProps.navigation.navigate('home');
  };

  const handleTimePickerOnChange = (event, date) => {
    if (Platform.OS === 'ios') {
      setTime(date);
    } else {
      // Android
      setShowOnAndroid(false);
      if (event.type !== 'dismissed') {
        setTime(date);
      }
    }
  };

  const outputDateTimePicker = () => {
    if (Platform.OS === 'ios' || (Platform.OS === 'android' && showOnAndroid)) {
      return (
        <DateTimePicker
          display="spinner"
          value={time}
          mode="time"
          is24Hour={true}
          locale="en_GB"
          onChange={handleTimePickerOnChange}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTxt}>
        Meal items saved within the set timeframe will be combined into a single
        meal
      </Text>
      {Platform.OS === 'android' && (
        <TouchableOpacity
          onPress={() => setShowOnAndroid(true)}
          style={styles.openTimePickerBtn}>
          <Text style={[styles.btnText, {color: '#7d8aff'}]}>
            Open time picker
          </Text>
        </TouchableOpacity>
      )}
      {outputDateTimePicker()}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnTxt}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CombineMealsSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
  },
  headerTxt: {
    fontFamily: 'System',
    fontSize: 16,
    width: '95%',
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
    alignSelf: 'center',
  },
  btnTxt: {
    fontSize: 17,
    fontFamily: 'System',
    color: 'white',
    fontWeight: '600',
  },
  openTimePickerBtn: {
    width: '90%',
    borderRadius: 20,
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#7d8aff',
    alignSelf: 'center',
    marginTop: 15,
  },
});
