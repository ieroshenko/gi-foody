import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import NumericInput from 'react-native-numeric-input';

const SingleSymptomSetting = (props) => {
  const lessSelected = props.item.operator === '<=';
  const equalSelected = props.item.operator === '==';
  const greaterSelected = props.item.operator === '>=';
  const sympValue = props.item.filterValue;

  return (
    <View
      style={
        lessSelected || equalSelected || greaterSelected
          ? [styles.singleSympContainer, {backgroundColor: '#ebedff'}]
          : styles.singleSympContainer
      }>
      <View style={styles.contentContainer}>
        <Text style={styles.sympName}>{props.item.sympName}</Text>
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={lessSelected ? styles.btnSelectedStyle : styles.btnStyle}
            onPress={() =>
              props.updateOptionOperator(props.item.sympName, '<=')
            }>
            <Text style={styles.operator}>{'<='}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={equalSelected ? styles.btnSelectedStyle : styles.btnStyle}
            onPress={() =>
              props.updateOptionOperator(props.item.sympName, '==')
            }>
            <Text style={styles.operator}>{'=='}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={greaterSelected ? styles.btnSelectedStyle : styles.btnStyle}
            onPress={() =>
              props.updateOptionOperator(props.item.sympName, '>=')
            }>
            <Text style={styles.operator}>{'>='}</Text>
          </TouchableOpacity>
        </View>
        <NumericInput
          value={sympValue}
          minValue={0}
          maxValue={10}
          type="up-down"
          totalWidth={105}
          rounded={true}
          onChange={(value) =>
            props.updateOptionValue(props.item.sympName, value)
          }
        />
      </View>
    </View>
  );
};

export default SingleSymptomSetting;

const styles = StyleSheet.create({
  singleSympContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    backgroundColor: 'white',
    borderBottomWidth: Platform.OS === 'android' ? 0.6 : 0,
    borderColor: '#c9c9c9',
  },
  contentContainer: {
    width: '95%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnStyle: {
    backgroundColor: '#ededed',
    marginLeft: 2,
    marginRight: 2,
    padding: 10,
    borderRadius: 10,
  },
  btnSelectedStyle: {
    backgroundColor: '#7d8aff',
    marginLeft: 5,
    marginRight: 5,
    padding: 11,
    borderRadius: 10,
  },
  sympName: {
    fontWeight: '700',
    fontSize: 16,
    width: '30%',
  },
  operator: {
    fontWeight: '600',
  },
});
