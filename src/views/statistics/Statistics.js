import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
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
import Orientation from 'react-native-orientation-locker';
import {Icon} from 'react-native-elements';
import * as RootNavigation from '../../hooks/RootNavigation';

const dayRangeItems = [
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
    sympsDayPotential[symptom] = 0;
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

/**
 * Returns an array of Objects. Each object contains symptomName, array of corresponding data, and random rgba color
 * @param dayRange: day range selected by user (30, 60, 180, 0{∞})
 * @param meals: all meals
 * @param trackedSymptoms: symptoms that user is tracking
 */
export const formatDataForDayRange = (dayRange, meals, trackedSymptoms) => {
  let statsData = initStatsData(trackedSymptoms);

  // fcn updates statsData each day
  const updateStatsData = (symptomsDayPotential) => {
    statsData.forEach((dataSymptom) => {
      dataSymptom.statsData.unshift(
        symptomsDayPotential[dataSymptom.symptomName],
      );
    });
  };

  // get the beginning of current day (00:00)
  let mealIndex = 0;
  // if day range is not ALL MEALS (indicated by zero)
  if (dayRange !== 0) {
    // get symptom potential for each day within day range
    for (let i = 0; i < dayRange; i++) {
      let numMealsThisDay = 0;
      let symptomsDayPotential: Object = initSymptomsDayPotential(
        trackedSymptoms,
      );

      let dayInMilliseconds = Date.now() - i * 86400000;

      for (mealIndex; mealIndex < meals.length; mealIndex++) {
        numMealsThisDay++;
        let currentMeal = meals[mealIndex];

        // check if it is within day in mSeconds
        if (checkIfSameDay(dayInMilliseconds, currentMeal.mealStarted)) {
          // iterate through tracked symptoms and update daily symptom potential
          trackedSymptoms.forEach((symptom) => {
            // make sure it exists in the meal
            if (currentMeal.mealSymptoms[symptom] !== undefined) {
              let mealSympValue = currentMeal.mealSymptoms[symptom];
              symptomsDayPotential[symptom] =
                (symptomsDayPotential[symptom] * (numMealsThisDay - 1) +
                  mealSympValue) /
                numMealsThisDay;
            }
          });
        } else {
          // probably already another day
          break;
        }
      }

      updateStatsData(symptomsDayPotential);
    }
  } else {
    let i = 0;
    while (true) {
      let numMealsThisDay = 0;
      let symptomsDayPotential: Object = initSymptomsDayPotential(
        trackedSymptoms,
      );

      let dayInMilliseconds = Date.now() - i * 86400000;

      for (mealIndex; mealIndex < meals.length; mealIndex++) {
        numMealsThisDay++;
        let currentMeal = meals[mealIndex];

        // check if it is within day in mSeconds
        if (checkIfSameDay(dayInMilliseconds, currentMeal.mealStarted)) {
          // iterate through tracked symptoms and update daily symptom potential
          trackedSymptoms.forEach((symptom) => {
            // make sure it exists in the meal
            if (currentMeal.mealSymptoms[symptom] !== undefined) {
              let mealSympValue = currentMeal.mealSymptoms[symptom];
              symptomsDayPotential[symptom] =
                (symptomsDayPotential[symptom] * (numMealsThisDay - 1) +
                  mealSympValue) /
                numMealsThisDay;
            }
          });
        } else {
          // probably already another day
          break;
        }
      }

      updateStatsData(symptomsDayPotential);

      i++;

      if (mealIndex === meals.length) {
        break;
      }
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
    );
    setStatsData(formattedDataForDisplay);
    setIsLoading(false);
  }, [dayRange]);

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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: 150,
            }}>
            <Text style={styles.dayRangeTxt}>Day range</Text>
            <DropDownPicker
              items={dayRangeItems}
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
            />
          </View>
          <View style={{width: '70%'}}>
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
  },
});
