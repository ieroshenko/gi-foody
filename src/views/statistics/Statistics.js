import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {Icon} from 'react-native-elements';
import React, {useEffect, useState} from 'react';
import {fetchMealData} from '../../wrappers/firestore/FirebaseWrapper';
import UserContext from '../../hooks/UserContext';
import DropDownPicker from 'react-native-dropdown-picker';
import ChartsManager from './ChartsManager';
import SymptomSelector from './SymptomSelector';
import ScreenOrientation, {
  LANDSCAPE,
  LANDSCAPE_LEFT,
} from 'react-native-orientation-locker/ScreenOrientation';
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';

const DAY_RANGES = [
  {
    label: '30',
    value: 30,
  },
  {
    label: '60',
    value: 60,
  },
  {
    label: '180',
    value: 180,
  },
  {
    label: '∞',
    value: 0,
  },
];

// fcn to get random RGBA color
const getRandomColor = () => {
  let o = Math.round,
    r = Math.random,
    s = 255;

  return (
    'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + 0.2 + ')'
  );
};

// initialize stats data
const initStatsData = (trackedSymptoms) => {
  let initData = [];

  trackedSymptoms.forEach((symptom) => {
    let initialDoc = {
      symptomName: symptom,
      statsData: [],
      color: getRandomColor(),
      isVisible: true,
    };
    initData.push(initialDoc);
  });

  return initData;
};

// initialize day symptoms potential object
// this is the object that stores daily symptom potential
const initSymptomsDayPotential = (trackedSymptoms) => {
  let sympsDayPotential = {};

  trackedSymptoms.forEach((symptom) => {
    sympsDayPotential[symptom] = {value: 0, numLegitMeals: 0};
  });

  return sympsDayPotential;
};

const checkIfSameDay = (dayMSeconds, mealMSeconds) => {
  let ans;
  let theDayDate = new Date(dayMSeconds);
  let mealDate = new Date(mealMSeconds);

  theDayDate.getFullYear() === mealDate.getFullYear() &&
  theDayDate.getMonth() === mealDate.getMonth() &&
  theDayDate.getDate() === mealDate.getDate()
    ? (ans = true)
    : (ans = false);
  return ans;
};

const updateSymptomsDayPotential = (
  symptomsDayPotential: Object,
  mealSympValue: number,
  symptom: string,
) => {
  symptomsDayPotential[symptom].value =
    (symptomsDayPotential[symptom].value *
      (symptomsDayPotential[symptom].numLegitMeals - 1) +
      mealSympValue) /
    symptomsDayPotential[symptom].numLegitMeals;
};

/**
 * Returns an array of Objects. Each object contains symptomName, array of corresponding data, and random rgba color
 * @param dayRange: day range selected by user (30, 60, 180, 0{∞})
 * @param meals: all meals
 * @param trackedSymptoms: symptoms that user is tracking
 */
export const formatDataForDayRange = (
  dayRange,
  meals,
  trackedSymptoms,
  includeZeroValue: boolean = true,
) => {
  let statsData = initStatsData(trackedSymptoms);

  // fcn updates statsData each day
  const updateStatsData = (symptomsDayPotential) => {
    statsData.forEach((dataSymptom) => {
      dataSymptom.statsData.unshift(
        symptomsDayPotential[dataSymptom.symptomName].value,
      );
    });
  };

  // get the beginning of current day (00:00)
  let mealIndex = 0;

  let iterationRange = dayRange === 0 ? 100000000000000 : dayRange;
  for (let i = 0; i < iterationRange; i++) {
    let symptomsDayPotential: Object = initSymptomsDayPotential(
      trackedSymptoms,
    );

    let dayInMilliseconds = Date.now() - i * 86400000;

    for (mealIndex; mealIndex < meals.length; mealIndex++) {
      let currentMeal = meals[mealIndex];

      // check if it is within day in mSeconds
      if (checkIfSameDay(dayInMilliseconds, currentMeal.mealStarted)) {
        // iterate through tracked symptoms and update daily symptom potential
        trackedSymptoms.forEach((symptom) => {
          // make sure it exists in the meal
          if (currentMeal.mealSymptoms[symptom] !== undefined) {
            let mealSympValue = currentMeal.mealSymptoms[symptom];

            // check if we want to include this meal into data calculation
            if (includeZeroValue || mealSympValue !== 0) {
              symptomsDayPotential[symptom].numLegitMeals++;

              updateSymptomsDayPotential(
                symptomsDayPotential,
                mealSympValue,
                symptom,
              );
            }
          }
        });
      } else {
        // probably already another day
        break;
      }
    }

    updateStatsData(symptomsDayPotential);

    if (dayRange === 0 && mealIndex === meals.length) {
      break;
    }
  }

  return statsData;
};

/////////////////////////////////////////////////////////////// COMPONENT /////////////////////////////////////////////

const Statistics = (props) => {
  const userID = React.useContext(UserContext);
  const symptoms = props.symptoms;
  const [dayRange, setDayRange] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [meals, setMeals] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [excludeZeroes, setExcludeZeroes] = useState(true);

  // fetch initial meal and statistics data
  useEffect(() => {
    if (symptoms.length) {
      setIsLoading(true);
      fetchMealData(userID).then((fetchedMeals) => {
        setMeals(fetchedMeals);
        let formattedDataForDisplay = formatDataForDayRange(
          dayRange,
          fetchedMeals,
          symptoms,
          !excludeZeroes,
        );
        setStatsData(formattedDataForDisplay);
        setIsLoading(false);
      });
    }
  }, [userID, symptoms]);

  //listens to changes in day range
  useEffect(() => {
    setIsLoading(true);
    let formattedDataForDisplay = formatDataForDayRange(
      dayRange,
      meals,
      symptoms,
      !excludeZeroes,
    );
    setStatsData(formattedDataForDisplay);
    setIsLoading(false);
  }, [dayRange, excludeZeroes]);

  const changeChartsToDisplay = (symptomName) => {
    let updatedData = statsData.map((symDataItem) => {
      if (symDataItem.symptomName === symptomName) {
        return {...symDataItem, isVisible: !symDataItem.isVisible};
      } else {
        return symDataItem;
      }
    });
    setStatsData(updatedData);
  };

  return (
    <>
      <SafeAreaView style={styles.body}>
        <ScreenOrientation
          orientation={props.orientation}
          onDeviceChange={(orientation) => {
            if (orientation === 'PORTRAIT') {
              props.openOrCloseStats(false);
            }
          }}
        />
        <View style={styles.contentContainer}>
          <View style={styles.statisticsContainer}>
            {isLoading ? (
              <ActivityIndicator style={{width: '30%'}} size="large" />
            ) : (
              statsData.length > 0 && <ChartsManager statsData={statsData} />
            )}
          </View>
          <View style={styles.optionSelector}>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Icon name="settings" size={28} />
            </TouchableOpacity>
            <View style={{width: '80%'}}>
              <FlatList
                contentContainerStyle={{height: 35}}
                style={{width: '100%'}}
                data={statsData}
                renderItem={({item}) => (
                  <SymptomSelector
                    symptomData={item}
                    updateSelection={changeChartsToDisplay}
                  />
                )}
                horizontal={true}
                keyExtractor={(item, index) => item.symptomName}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
      {showSettings && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: '100%',
            width: '50%',
            backgroundColor: 'white',
            padding: 50,
          }}>
          <Text style={styles.settingsLabel}>Settings</Text>
          <View style={[styles.radioBtnContainer, styles.settingsOption]}>
            <Text style={styles.radioLabel}>
              Exclude 0-values from calculating daily symptom potential
            </Text>
            <TouchableOpacity
              style={
                excludeZeroes
                  ? [styles.radioBtn, {backgroundColor: '#7d8aff'}]
                  : styles.radioBtn
              }
              onPress={() => setExcludeZeroes(!excludeZeroes)}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: 150,
            }}>
            <Text style={styles.dayRangeTxt}>Day range</Text>
            <DropDownPicker
              items={DAY_RANGES}
              defaultValue={dayRange}
              containerStyle={styles.pickerContainer}
              itemStyle={styles.dayRangeItem}
              labelStyle={styles.labelStyle}
              selectedLabelStyle={{marginLeft: 4}}
              showArrow={false}
              onChangeItem={(item) => {
                if (item.label !== '∞') {
                  setDayRange(item.value);
                } else {
                  // infinity
                  setDayRange(0);
                }
              }}
              dropDownMaxHeight={200}
              zIndex={5000}
            />
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowSettings(false)}>
            <Text style={styles.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    padding: 10,
    borderColor: 'gray',
  },
  optionSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 35,
    alignItems: 'center',
    position: 'absolute',
    marginTop: 20,
    marginLeft: 10,
  },
  dayRangeTxt: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  dayRangeItem: {justifyContent: 'center', alignItems: 'center'},
  statisticsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    height: '78%',
    width: '99%',
    bottom: 30,
    alignSelf: 'center',
  },
  pickerContainer: {
    height: 40,
    width: 60,
  },
  labelStyle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    fontFamily: 'System',
  },
  settingsLabel: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  radioBtn: {
    height: 25,
    width: 25,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#9da6fc',
  },
  radioBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioLabel: {
    width: '80%',
    fontFamily: 'System',
    fontSize: 16,
  },
  settingsOption: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingTop: 5,
    paddingBottom: 5,
    borderColor: '#e8e8e8',
  },
  closeBtn: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#7d8aff',
    width: '50%',
    height: 40,
    bottom: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
