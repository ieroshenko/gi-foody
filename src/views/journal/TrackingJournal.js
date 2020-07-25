import React, {useEffect, useState, useReducer} from 'react';
import firestore from '@react-native-firebase/firestore';
import {flatListRef} from '../../hooks/JournalList';
import Meal from './Meal';

import {
  Text,
  FlatList,
  View,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-community/async-storage';
import UserContext from '../../hooks/UserContext';

const manageCache = async () => {
  try {
    // Get the size of cache dir
    let cacheStat = await RNFetchBlob.fs.stat(RNFetchBlob.fs.dirs.CacheDir);

    if (cacheStat.size > 40000000) {
      // iterate through Async Storage and delete least relevant images based on time created
      AsyncStorage.getAllKeys((error, keys) => {
        if (error) {
          throw error;
        }
        // Try deleting image cache of items that were added more than 3 days ago
        let threeDaysAgo = new Date().getTime() - 259200000;
        keys.forEach((mealItemMillisecondsStr) => {
          if (Number(mealItemMillisecondsStr) < threeDaysAgo) {
            // Delete image and item in async storage
            AsyncStorage.getItem(mealItemMillisecondsStr).then((imgID) => {
              // console.log(imgID);
              RNFetchBlob.fs
                .unlink(`${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`)
                .then(() => {
                  AsyncStorage.removeItem(mealItemMillisecondsStr, (error) => {
                    if (error) {
                      console.log(error);
                    }
                  });
                })
                .catch((error) => console.log(error));
            });
          }
        });
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const scanReducer = (state, [type, meals, lastVisible, mealID]) => {
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
      let newMealID = meals[0].id;
      if (
        !state.documentData.some((element) => {
          return element.id === newMealID;
        })
      ) {
        return {
          ...state,
          documentData: [...meals, ...state.documentData],
          isEmpty: false,
        };
      } else {
        return {...state, isEmpty: false};
      }

    case 'additional':
      return {
        ...state,
        documentData: [...state.documentData, ...meals],
        lastVisible: lastVisible,
      };

    case 'delete':
      let filteredData = state.documentData.filter(
        (item) => item.id !== mealID,
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
  }
  return state;
};

const initialState = {documentData: [], lastVisible: null, isEmpty: false};
const limit = 7;

const ItemList = (props) => {
  const userID = React.useContext(UserContext);
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const deleteItemByID = (mealID) => {
    // let filteredData = state.documentData.filter((item) => item.id !== mealID);
    dispatch(['delete', null, null, mealID]);
  };

  useEffect(() => {
    try {
      // Listen for the App State Changes
      // AppState.addEventListener('change', (newState) => {
      //   if (newState === 'active') {
      //     NetInfo.fetch().then((state) => {
      //       if (state.isConnected && !isEmpty) {
      //         setDocumentData([]);
      //         setLastVisible(null);
      //         retrieveData();
      //       }
      //     });
      //   }
      // });

      let unsubscribe = () => null;

      // to prevent weird behaviour when logging out and loggin back in
      if (userID !== '') {
        // Cloud Firestore: Initial Query (to start with)
        retrieveData().then(() => {
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
  }, [userID]);

  /**
   * Retrieve the initial Meal data from Firestore (9 meals)
   * @return {Promise<void>}
   */
  const retrieveData = async () => {
    try {
      setLoading(true);
      // Clean cache if necessary
      await manageCache();

      // Cloud firestore data
      let initialQuery = await firestore()
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
        let initialDocData = documentSnapshots.docs.map((doc) => {
          let newData = doc.data();
          newData.id = doc.id;

          return newData;
        });

        // get the time stamp of the last visible document (Document timestamp To Start From For Proceeding Queries)
        let lastVisibleDoc =
          initialDocData[initialDocData.length - 1].mealStarted;
        // Set State
        setLoading(false);
        dispatch(['initial', initialDocData, lastVisibleDoc]);
      } else {
        dispatch(['initial', [], null, null]);
      }
    } catch (e) {
      console.log('Error occured in retrieveData:' + e);
    }
  };

  /**
   * Adds a listener for Firestore query to listen to new meals added
   * And once meal is added, display it as Flatlist
   * @return {Promise<void>}
   */
  const handleNewMeals = async (querySnapshot) => {
    try {
      if (querySnapshot.size != 0) {
        let newDocRef = querySnapshot.docs[0];
        let newData = newDocRef.data();
        newData.id = newDocRef.id;
        let newMealData = [newData];

        dispatch(['new', newMealData, null]);
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
    try {
      // Set State: Refreshing
      setRefreshing(true);

      let additionalQuery = await firestore()
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
        let additionalDocumentData = documentSnapshots.docs.map((doc) => {
          let newData = doc.data();
          newData.id = doc.id;
          return newData;
        });

        // Cloud Firestore: Last Visible Document (Document ID To Start From For Proceeding Queries)
        let lastVisibleAdditional =
          additionalDocumentData[additionalDocumentData.length - 1].mealStarted;
        // Set State
        dispatch(['additional', additionalDocumentData, lastVisibleAdditional]);

        setRefreshing(false);
      }
    } catch (e) {
      console.log(e);
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

  return (
    <>
      {!state.isEmpty ? (
        <FlatList
          data={state.documentData}
          renderItem={({item}) => (
            <Meal item={item} deleteMeal={deleteItemByID} />
          )}
          ref={flatListRef}
          // Item Key
          keyExtractor={(item, index) => String(item.id)}
          // Footer (Activity Indicator)
          ListFooterComponent={renderFooter}
          // OnEndReached (function that is called when end is reached)
          onEndReached={retrieveMore}
          // How Close To The End Of List Until Next Data Request Is Made
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          style={styles.body}
          contentContainerStyle={styles.contentContainer}
        />
      ) : (
        <ScrollView>
          <View>
            <Text>Please, log your first meal!</Text>
          </View>
        </ScrollView>
      )}
    </>
  );
};

export default ItemList;

export const sympColors = new Map([
  ['0', '#7dff7d'],
  ['1', '#d4ff7d'],
  ['2', '#f2ff7d'],
  ['3', '#ffe97d'],
  ['4', '#ffd47d'],
  ['5', '#ffc57d'],
  ['6', '#ffba7d'],
  ['7', '#ffa67d'],
  ['8', '#ff977d'],
  ['9', '#ff8c7d'],
  ['10', '#ff7d7d'],
]);

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});

/**
 * Using https://levelup.gitconnected.com/react-native-firebase-cloud-firestore-implementing-infinite-scroll-lazy-loading-with-flatlist-a9e942cf66c6
 * as an example. Thanks!
 */
