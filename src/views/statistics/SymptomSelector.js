import React from 'react';
import {StyleSheet, TouchableOpacity, Text} from 'react-native';

const SymptomSelector = (props) => {
  const symptomData = props.symptomData;

  return (
    <TouchableOpacity
      style={[styles.btn, {backgroundColor: symptomData.color}]}
      onPress={() => props.updateSelection(symptomData.symptomName)}>
      <Text>{symptomData.symptomName}</Text>
    </TouchableOpacity>
  );
};

export default SymptomSelector;

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
    width: 100,
    borderRadius: 10,
  },
});
