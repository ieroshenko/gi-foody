import React from 'react';
import UserContext from '../../../hooks/UserContext';
import {sympColors} from '../../../constants/SymptomColors';
import firebase from '@react-native-firebase/app';
import {Platform, Text, View, StyleSheet} from 'react-native';
import {Slider} from 'react-native-elements';

const SymptomEditable = (props) => {
  const userID = React.useContext(UserContext);
  let sympValue = props.symptom[1];
  let sympID = props.symptom[0];
  let color = sympColors.get(sympValue.toString());

  const updateDBValue = async () => {
    let fieldMapToBeUpdated = {};
    fieldMapToBeUpdated[`mealSymptoms.${sympID}`] = sympValue;

    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('meals')
      .doc(props.mealID)
      .update(fieldMapToBeUpdated)
      .then(() => console.log('updated symptom value'));

    // Update parent component's value
    props.updateParentSymptom(sympID, sympValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sympLabel}>{sympID}</Text>
      <Slider
        style={styles.slider}
        value={sympValue}
        step={1}
        onValueChange={(newValue) => {
          props.updateParentSymptom(sympID, newValue);
        }}
        onSlidingComplete={updateDBValue}
        minimumValue={0}
        maximumValue={10}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#ebebeb"
        thumbStyle={styles.sliderThumbStyle}
      />
      <Text style={styles.sympValue}>{sympValue}</Text>
    </View>
  );
};

export default SymptomEditable;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {width: '75%', height: 40},
  sympLabel: {fontFamily: 'System', fontSize: 15, width: '20%'},
  sliderThumbStyle: {
    backgroundColor: 'white',
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#ebebeb',
  },
  sympValue: {fontFamily: 'System', fontSize: 15, fontWeight: '700'},
});
