import React, {useEffect, useMemo, useState} from 'react';
import UserContext from '../../../hooks/UserContext';
import NetInfoContext from '../../../hooks/NetInfoContext';
import firebase from '@react-native-firebase/app';
import {
  getMealItem,
  updateSymptomNotes,
} from '../../../wrappers/firestore/FirebaseWrapper';
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
import Database from '../../../wrappers/sqlite/SqliteFasade';
import {getTitleDate, renderSymptom} from '../GlobalMealFunctions';

const checkIfSymptomsAreShallowEqual = (msOld, msNew) => {
  const keysOld = Object.keys(msOld);
  const keysNew = Object.keys(msNew);

  if (keysOld.length !== keysNew.length) {
    return false;
  }

  for (let key of keysOld) {
    if (msOld[key] !== msNew[key]) {
      return false;
    }
  }

  return true;
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

const Meal = React.memo(
  (props) => {
    const userID = React.useContext(UserContext);
    let isNetOnline = React.useContext(NetInfoContext);
    const [symptomNotes, setSymptomNotes] = useState(props.item.symptomNotes);
    const [mealItems, setMealItems] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [mealSymptoms, setMealSymptoms] = useState([]);

    useMemo(() => {
      setMealSymptoms(
        props.item.mealSymptoms ? Object.entries(props.item.mealSymptoms) : [],
      );
    }, [props.item.mealSymptoms]);

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
    }, [isNetOnline, userID]);

    const updateSymptom = (sympID, newSympValue) => {
      let updatedArray = mealSymptoms.map(([arraySympID, sympVal]) => {
        if (arraySympID === sympID) {
          return [sympID, newSympValue];
        } else {
          return [arraySympID, sympVal];
        }
      });
      // update SQLite
      Database.updateSymptoms(userID, props.item.id, updatedArray);
      setMealSymptoms(updatedArray);
    };

    const updateSymptomNotesLocallyAndDB = () => {
      let mealId = props.item.id;
      setSymptomNotes(symptomNotes);
      updateSymptomNotes(userID, mealId, symptomNotes);
      Database.updateSymptomNote(userID, mealId, symptomNotes);
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
              userID,
            ),
          ),
        ).then((newData) => {
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
          showsHorizontalScrollIndicator={false}
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
            style={{minHeight: 35}}
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
            symptomNotes={symptomNotes}
            updateSymptomNotes={updateSymptomNotesLocallyAndDB}
            setNotes={(notes) => setSymptomNotes(notes)}
          />
        </Modal>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // check if meal symptoms are the same
    // if equal, skipp update
    let equal = checkIfSymptomsAreShallowEqual(
      prevProps.item.mealSymptoms,
      nextProps.item.mealSymptoms,
    );
    return equal;
  },
);

export default Meal;

const styles = StyleSheet.create({
  sympContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '95%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    width: '95%',
    marginTop: 12.5,
    marginBottom: 12.5,
    borderRadius: 15,
    alignSelf: 'center',
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
