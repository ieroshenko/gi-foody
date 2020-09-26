import React, {useEffect, useState, useReducer, useMemo} from 'react';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {flatListRef} from '../../../hooks/JournalList';
import Meal from './Meal';

import {
  Text,
  FlatList,
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import UserContext from '../../../hooks/UserContext';
import Database from '../../../wrappers/sqlite/SqliteFasade';
import MealObj from '../../../entities/MealObj';

/**
 * Function that deletes {10} images from cache if image cache size is bigger than {40} MB
 * @return {Promise<void>}
 */
const manageCache = async () => {
  try {
    const numImgToDelete = 10;
    let currentTime = Date.now();

    // Get the size of cache dir
    let cacheStat = await RNFetchBlob.fs.stat(
      `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`,
    );

    // 40 (40000000) MB
    if (cacheStat.size > 40000000) {
      let stats = await RNFetchBlob.fs
        .lstat(`${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`)
        .catch((err) => {
          if (err) {
            console.log(err);
          }
        });

      let numToDelete =
        stats.length <= numImgToDelete ? stats.length : numImgToDelete;

      // a little system to make sure to avoid unexpected async behavior when downloading uncached images
      let i = 0;
      let j = 0;
      while (i < numToDelete && j < stats.length) {
        let fileStat = stats[j];
        // can delete cached images that were modified at least 5 (300000) minutes ago and before
        if (fileStat.lastModified < currentTime - 300000) {
          await RNFetchBlob.fs.unlink(
            `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${fileStat.filename}`,
          );
          console.log('deleted image from cache');
          i++;
          j++;
        } else {
          j++;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};

const scanReducer = (state, [type, meals, lastVisible, mealID, userID]) => {
  console.log(type);
  switch (type) {
    case 'initial':
      isEmpty = meals.length === 0 ? true : false;
      return {
        ...state,
        documentData: meals,
        lastVisible: lastVisible,
        isEmpty: isEmpty,
      };

    case 'new':
      let newMeal = meals[0];
      let updatedMeals = state.documentData.slice();
      if (
        !state.documentData.some((element, index) => {
          if (element.mealID === newMeal.mealID) {
            updatedMeals[index] = newMeal;
            return true;
          } else {
            return false;
          }
        })
      ) {
        return {
          ...state,
          documentData: [...meals, ...state.documentData],
          isEmpty: false,
        };
      } else {
        return {...state, documentData: updatedMeals, isEmpty: false};
      }

    case 'additional':
      if (meals.length) {
        let updatedMeals = [...state.documentData, ...meals];
        return {
          ...state,
          documentData: updatedMeals,
          lastVisible: lastVisible,
        };
      }

    case 'delete':
      let filteredData = state.documentData.filter(
        (item) => item.mealID !== mealID,
      );
      let isEmpty = filteredData.length === 0 ? true : false;

      return {
        ...state,
        documentData: filteredData,
        lastVisible: isEmpty
          ? null
          : filteredData[filteredData.length - 1].mealStarted,
        isEmpty: isEmpty,
      };

    case 'newItem':
      // update the first item only
      let docDataCopy = state.documentData.slice();
      docDataCopy[0] = meals[0];

      return {...state, documentData: docDataCopy};
  }
  return state;
};

const initialState = {
  documentData: [],
  lastVisible: null,
  isEmpty: false,
  mealID: null,
};

const limit = 7;

const ItemList = (props) => {
  const userID = React.useContext(UserContext);
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(false);

  useEffect(() => {
    if (state.documentData.length) {
      // get meal items, then update flatlist
      let firstMeal = state.documentData[0].cloneMeal();
      firstMeal
        .obtainMealItems()
        .then(() => dispatch(['newItem', [firstMeal]]));
    }
  }, [props.newItemAdded]);

  const onRefresh = () => {
    setRefreshing(true);
    retrieveData(userID).then(() => setRefreshing(false));
  };

  const processDocSnapshots: [] = async (docSnapshotArray) => {
    let meals = [];
    let mealDocArray = docSnapshotArray.docs;

    for (let i = 0; i < mealDocArray.length; i++) {
      let doc = mealDocArray[i];
      let newData = doc.data();
      let mealId = doc.id;

      // build meal
      let meal = new MealObj.Builder(userID, mealId)
        .withMealStarted(newData.mealStarted)
        .withMealSymptoms(newData.mealSymptoms)
        .withSymptomNotes(newData.symptomNotes)
        .build();

      // get meal items
      await meal.obtainMealItems();
      meals.push(meal);
    }

    return meals;
  };

  const deleteItemByID = (mealID) => {
    // let filteredData = state.documentData.filter((item) => item.id !== mealID);
    dispatch(['delete', null, null, mealID, userID]);
  };

  useEffect(() => {
    try {
      let unsubscribe = () => null;

      // to prevent weird behaviour when logging out and loggin back in
      if (userID !== '' && userID !== null) {
        // Cloud Firestore: Initial Query (to start with)
        retrieveData(userID).then(() => {
          // add a listener for new meals
          unsubscribe = firestore()
            .collection('users')
            .doc(userID)
            .collection('meals')
            .orderBy('mealStarted', 'desc')
            .limit(1)
            .onSnapshot((querySnapshot) => handleNewMeals(querySnapshot));
        });
      }

      return () => unsubscribe();
    } catch (error) {
      console.log(error);
    }
  }, [userID, state.isEmpty]);

  /**
   * Retrieve the initial Meal data from Firestore (9 meals)
   * @return {Promise<void>}
   */
  const retrieveData = async (userID) => {
    try {
      setLoading(true);

      // Cloud firestore data
      let initialQuery = firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('meals')
        .orderBy('mealStarted', 'desc')
        .limit(limit);

      // Cloud Firestore: Query Snapshot
      let documentSnapshots = await initialQuery.get();

      // Make sure we found meals
      if (!documentSnapshots.empty) {
        // Get array of objects with document fields and refs to get mealItems later on
        let initialDocData = await processDocSnapshots(documentSnapshots);

        // get the time stamp of the last visible document (Document timestamp To Start From For Proceeding Queries)
        let lastVisibleDoc =
          initialDocData[initialDocData.length - 1].mealStarted;
        // Set State
        setCanLoadMore(true);
        dispatch(['initial', initialDocData, lastVisibleDoc]);
        setLoading(false);
      } else {
        dispatch(['initial', [], null, null]);
        setLoading(false);
        setCanLoadMore(true);
      }
    } catch (e) {
      console.log('Error occured in retrieveData:' + e);
      setLoading(false);
    }
  };

  /**
   * Adds a listener for Firestore query to listen to new meals added
   * And once meal is added, display it as Flatlist
   * @return {Promise<void>}
   */
  const handleNewMeals = async (querySnapshot) => {
    try {
      if (!querySnapshot.empty) {
        let newMealData = await processDocSnapshots(querySnapshot);

        dispatch(['new', newMealData, null, null, userID]);
        setLoading(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Retrieve another batch of meals from Firestore (9) starting from previous last visible item
   * @return {Promise<void>}
   */
  const retrieveMore = async () => {
    if (!loading && canLoadMore) {
      try {
        // Set State: Loading
        setLoading(true);

        await manageCache();

        let additionalQuery = firestore()
          .collection('users')
          .doc(userID)
          .collection('meals')
          .orderBy('mealStarted', 'desc')
          .startAfter(state.lastVisible)
          .limit(limit);

        // Cloud Firestore: Query Snapshot
        let documentSnapshots = await additionalQuery.get();
        if (!documentSnapshots.empty) {
          // Get array of objects with document fields and refs to get mealItems later on
          let additionalDocumentData = await processDocSnapshots(
            documentSnapshots,
          );

          // Cloud Firestore: Last Visible Document (Document ID To Start From For Proceeding Queries)
          let lastVisibleAdditional =
            additionalDocumentData[additionalDocumentData.length - 1]
              .mealStarted;

          setLoading(false);
          // Set State
          dispatch([
            'additional',
            additionalDocumentData,
            lastVisibleAdditional,
          ]);
        } else {
          setCanLoadMore(false);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.log(e);
      }
    }
  };

  /**
   * Return ActivityIndicator element in case if we're loading new meals
   * @return {null|*}
   */
  const renderFooter = () => {
    try {
      if (loading) {
        return <ActivityIndicator />;
      } else {
        return null;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const renderMeal = ({item}) => {
    return <Meal item={item} deleteMeal={deleteItemByID} />;
  };

  return (
    <View style={{flex: 1, height: Dimensions.get('window').height}}>
      <FlatList
        data={state.documentData}
        renderItem={renderMeal}
        ref={flatListRef}
        // Item Key
        keyExtractor={(item, index) => String(item.mealID)}
        // Footer (Activity Indicator)
        ListFooterComponent={renderFooter}
        // OnEndReached (function that is called when end is reached)
        onEndReached={retrieveMore}
        // How Close To The End Of List Until Next Data Request Is Made
        onEndReachedThreshold={0.5}
        style={styles.body}
        contentContainerStyle={styles.contentContainer}
        horizontal={false}
        removeClippedSubviews={false}
        windowSize={5}
        maxToRenderPerBatch={limit}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      {state.isEmpty && (
        <View style={styles.emptyDataContainer}>
          <Text style={styles.emptyDataTitle}>Add your first meal!</Text>
          <Text style={styles.emptyDataText}>
            Tap the big, orange button below to do so.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ItemList;

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    justifyContent: 'flex-start',
  },
  emptyDataContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 40,
    marginTop: 150,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    position: 'absolute',
  },
  emptyDataTitle: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 18,
    marginBottom: 10,
    color: '#7d8aff',
    textAlign: 'center',
  },
  emptyDataText: {
    fontFamily: 'System',
    fontSize: 16,
    textAlign: 'center',
  },
});

/**
 * Using https://levelup.gitconnected.com/react-native-firebase-cloud-firestore-implementing-infinite-scroll-lazy-loading-with-flatlist-a9e942cf66c6
 * as an example. Thanks!
 */
