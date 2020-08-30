import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import SingleSymptomSetting from './SingleSymptomSetting';
import {Icon} from 'react-native-elements';

const FilterSettings = (props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <TouchableOpacity style={styles.emptyBtnPlaceholder} />
        <Text style={styles.headerText}>Filter Settings</Text>
        <TouchableOpacity onPress={() => props.closeSelf()}>
          <Icon name="close" size={30} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <Text style={styles.instructions}>
          {
            <Text style={styles.instructionHeader}>
              Specify symptom filtering options
            </Text>
          }
          {
            '\nSo that you can look through all the meals that match your symptom-filters.'
          }
        </Text>
        <View>
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={props.settings}
            renderItem={({item}) => (
              <SingleSymptomSetting
                item={item}
                updateOptionOperator={props.updateSympOperator}
                updateOptionValue={props.updateSympValue}
              />
            )}
            keyExtractor={(item, index) => item.sympName}
            scrollEnabled={false}
          />
          <View style={styles.andOrContainer}>
            <Text style={styles.andOrTitle}>
              Which search option would you like to choose?
            </Text>
            <Text style={styles.andOrDescription}>
              {"Specifying 'AND' will output only meals that meet ALL of your conditions.\n\n" +
                "Specifying 'OR' will output all meals that meet at least one of your conditions (not necessarily meeting ALL your conditions at once)"}
            </Text>
            <View style={styles.andOrBtnContainer}>
              <View style={styles.andOrOption}>
                <Text style={styles.andOrTxt}>AND</Text>
                <TouchableOpacity
                  style={styles.andOrBtn}
                  onPress={() => props.changeAndOrOption('and')}>
                  <Icon
                    name={
                      props.andOrOption === 'and'
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    style={styles.btnIcon}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.andOrOption}>
                <Text style={styles.andOrTxt}>OR</Text>
                <TouchableOpacity
                  style={styles.andOrBtn}
                  onPress={() => props.changeAndOrOption('or')}>
                  <Icon
                    name={
                      props.andOrOption === 'or'
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    style={styles.btnIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.submitButtonStyle}
            onPress={() => {
              props.apply();
              props.closeSelf();
            }}>
            <Text style={styles.buttonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FilterSettings;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  listContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  list: {backgroundColor: 'white'},
  headerContentContainer: {
    width: '95%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingBottom: 10,
    paddingTop: 10,
  },
  emptyBtnPlaceholder: {
    width: 35,
  },
  headerText: {fontWeight: '600', fontSize: 16},
  submitButtonStyle: {
    width: '90%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7d8aff',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  btnContainer: {
    paddingTop: 20,
    width: '100%',
  },
  instructions: {
    fontFamily: 'System',
    fontSize: 16,
    width: '95%',
    alignSelf: 'center',
  },
  instructionHeader: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    width: '100%',
    marginBottom: 5,
  },
  andOrContainer: {
    marginTop: 20,
    width: '95%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  andOrTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    width: '100%',
  },
  andOrDescription: {fontFamily: 'System', fontSize: 16},
  andOrBtnContainer: {
    width: '100%',
    borderTopWidth: 0.5,
    borderColor: '#dbdbdb',
    padding: 10,
    paddingLeft: 100,
    paddingRight: 100,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  andOrOption: {},
  andOrTxt: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 17,
  },
  andOrBtn: {},
  btnIcon: {
    marginTop: 10,
  },
});
