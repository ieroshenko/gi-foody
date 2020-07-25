import React, {useEffect, useState} from 'react';
import UserContext from '../../hooks/UserContext';
import NetInfoContext from '../../hooks/NetInfoContext';
import firebase from '@react-native-firebase/app';
import {getMealItem} from '../../wrappers/FirebaseWrapper';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import MealDetails from './MealDetailsScreen';
import {sympColors} from './TrackingJournal';
import * as RNLocalize from 'react-native-localize';

const deviceTimeSettings = {
  deviceTimeZone: RNLocalize.getTimeZone(),
  uses24HourClock: RNLocalize.uses24HourClock(),
};

const renderMealItem = ({item}) => {
  let transformDeg = item.isAndroid ? '90deg' : '0deg';
  return (
    <Image
      source={{uri: item.picPath}}
      style={[
        styles.mealItemImage,
        {
          transform: [{rotate: transformDeg}],
        },
      ]}
    />
  );
};

const renderSymptom = ({item}) => {
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
      // console.log(monthUpper);
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

const Meal = (props) => {
  const userID = React.useContext(UserContext);
  const isNetOnline = React.useContext(NetInfoContext);
  const [mealItems, setMealItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mealSymptoms, setMealSymptoms] = useState(
    Object.entries(props.item.mealSymptoms),
  );

  useEffect(() => {
    // Create the Firestore query to listen for the newest item
    let unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('meals')
      .doc(props.item.id)
      .collection('mealItems')
      .orderBy('timeStamp', 'desc')
      .onSnapshot((querySnapshot) => updateMealItems(querySnapshot));

    return () => unsubscribe();
  }, []);

  const updateSymptom = (sympID, newSympValue) => {
    let updatedArray = mealSymptoms.map(([arraySympID, sympVal]) => {
      if (arraySympID === sympID) {
        return [sympID, newSympValue];
      } else {
        return [arraySympID, sympVal];
      }
    });
    setMealSymptoms(updatedArray);
  };

  /**
   * Add a listener for all the meal items of the meal to display any changes (adding new meal items)
   * @return {Promise<void>}
   */
  const updateMealItems = async (querySnapshot) => {
    try {
      Promise.all(
        querySnapshot.docs.map((queryDocSnapshot) =>
          getMealItem(
            queryDocSnapshot.data(),
            queryDocSnapshot.id,
            props.item.id,
            isNetOnline,
          ),
        ),
      ).then((newData) => {
        if (newData.length === 0) {
          props.deleteMeal(props.item);
        }
        setMealItems(newData);
      });
    } catch (e) {
      console.log(e);
    }
  };

  const closeDetailScreen = () => {
    setIsModalVisible(false);
  };

  let title = getTitleDate(props.item.mealStarted.toDate());
  return (
    <View style={styles.mealCard}>
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={mealItems}
        // Item Key
        keyExtractor={(item, index) => item.itemID}
        horizontal={true}
        renderItem={renderMealItem}
        style={styles.mealItemContainer}
      />
      <View style={styles.btnContainer}>
        <TouchableOpacity
          style={styles.openDetailsBtn}
          onPress={() => setIsModalVisible(true)}>
          <Text style={styles.openDetailsTxt}>DETAILS</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sympContainer}>
        <FlatList
          data={mealSymptoms}
          keyExtractor={([id, val], index) => id}
          renderItem={renderSymptom}
        />
      </View>
      <Modal style={{margin: 0}} isVisible={isModalVisible}>
        <MealDetails
          close={closeDetailScreen}
          meal={props.item}
          mealSymptoms={mealSymptoms}
          items={mealItems}
          title={title}
          deleteMeal={props.deleteMeal}
          updateParentSymptoms={updateSymptom}
        />
      </Modal>
    </View>
  );
};

export default Meal;

const styles = StyleSheet.create({
  sympContainer: {
    borderRadius: 15,
    backgroundColor: 'red',
    overflow: 'hidden',
    width: '95%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    width: Dimensions.get('window').width - 35,
    marginTop: 12.5,
    marginBottom: 12.5,
    borderRadius: 15,
  },
  titleWrapper: {
    margin: 20,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#7d8aff',
  },
  mealItemContainer: {
    alignSelf: 'center',
    width: '95%',
    marginBottom: 15,
    height: 110,
  },
  btnContainer: {
    width: '100%',
    paddingBottom: 20,
    justifyContent: 'center',
    marginTop: 5,
  },
  openDetailsBtn: {
    backgroundColor: '#ebedff',
    width: '50%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  openDetailsTxt: {
    color: '#7d8aff',
    fontFamily: 'System',
    fontWeight: '700',
  },
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
  mealItemImage: {
    height: 100,
    width: 100,
    alignSelf: 'center',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
});
