import React, {useEffect, useMemo, useState} from 'react';
import UserContext from '../../../hooks/UserContext';
import NetInfoContext from '../../../hooks/NetInfoContext';
import firebase from '@react-native-firebase/app';
import {
  deleteMealDB,
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

const RenderMealItem = (props) => {
  const [downloadedImg, setDownloadedImg] = useState(false);

  useEffect(() => {
    props.item.handleImgDownload().then(() => setDownloadedImg(true));
  }, [props.item]);

  let transformDeg = props.item.isAndroid ? '90deg' : '0deg';
  return (
    <>
      {downloadedImg ? (
        <Image
          source={{uri: props.item.picPath}}
          style={[
            styles.mealItemImage,
            {
              transform: [{rotate: transformDeg}],
            },
          ]}
        />
      ) : (
        <View style={styles.mealItemImage} />
      )}
    </>
  );
};

const Meal = React.memo(
  (props) => {
    const userID = React.useContext(UserContext);
    const [symptomNotes, setSymptomNotes] = useState(props.item.symptomNotes);
    const [mealItems, setMealItems] = useState(props.item.mealItems);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [mealSymptoms, setMealSymptoms] = useState([]);

    const updateMealItemNote = (itemID, newNote) => {
      let updatedItems = mealItems.map((mealItem) => {
        if (mealItem.id === itemID) {
          mealItem.notes = newNote;
        }

        return mealItem;
      });

      setMealItems(updatedItems);
    };

    const deleteMealItem = (itemID, mealID) => {
      let updatedMealItems = mealItems.filter(
        (item, index, array) => item.id !== itemID,
      );
      setMealItems(updatedMealItems);
      if (updatedMealItems.length === 0) {
        // Delete the meal completely
        deleteMeal(mealID);
        // Close the modal
        setIsModalVisible(false);
      }
    };

    const deleteMeal = async (mealID) => {
      try {
        // Delete from flatlist
        props.deleteMeal(mealID);
        // delete from DB
        await deleteMealDB(userID, mealID);
      } catch (e) {
        console.log(e);
      }
    };

    useMemo(() => {
      setMealSymptoms(
        props.item.mealSymptoms ? Object.entries(props.item.mealSymptoms) : [],
      );
    }, [props.item.mealSymptoms]);

    useEffect(() => {
      // Load meal items
      setMealItems(props.item.mealItems);
    }, [props.item.mealItems]);

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

    const updateSymptomNotesLocallyAndDB = () => {
      let mealId = props.item.mealID;
      setSymptomNotes(symptomNotes);
      updateSymptomNotes(userID, mealId, symptomNotes);
      Database.updateSymptomNote(userID, mealId, symptomNotes);
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
          keyExtractor={(item, index) => item.id}
          horizontal={true}
          renderItem={({item}) => <RenderMealItem item={item} />}
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
            deleteMealItem={deleteMealItem}
            title={title}
            updateParentSymptoms={updateSymptom}
            symptomNotes={symptomNotes}
            updateSymptomNotes={updateSymptomNotesLocallyAndDB}
            setNotes={(notes) => setSymptomNotes(notes)}
            updateMealItemNote={updateMealItemNote}
          />
        </Modal>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // check if meal symptoms are the same
    let equalSymp = checkIfSymptomsAreShallowEqual(
      prevProps.item.mealSymptoms,
      nextProps.item.mealSymptoms,
    );

    // check if meal items are the same
    let equalItems =
      prevProps.item.mealItems.length === nextProps.item.mealItems.length;

    return equalSymp && equalItems;
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
    backgroundColor: '#e6e6e6',
  },
});
