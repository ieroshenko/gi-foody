import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {Icon} from 'react-native-elements';
import React from 'react';

const Symptom = (props) => {
  return (
    <View style={styles.symptom}>
      <Text style={{fontSize: 16, fontFamily: 'System', fontWeight: '600'}}>
        {props.item}
      </Text>
      <TouchableOpacity
        onPress={() => props.deleteSymptom(props.item)}
        style={styles.sympIcon}>
        <Icon name="delete" color="#ff7d7d" size={28} />
      </TouchableOpacity>
    </View>
  );
};

export default Symptom;

const styles = StyleSheet.create({
  symptom: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    backgroundColor: 'white',
  },
  sympIcon: {
    height: 30,
    width: 30,
  },
});
