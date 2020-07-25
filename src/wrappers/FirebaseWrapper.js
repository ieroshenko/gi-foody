import storage from '@react-native-firebase/storage';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as NotificationsController from '../services/LocalPushController';
import {
  addPictureToCloud,
  deletePictureFromCloud,
  handleObtainingDownloadUrl,
} from './CloudStorageWrapper';

export const handleOfflineImages = async (userID) => {
  try {
    let unUploadedFavItemImages = firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('savedMealItems')
      .where('uploadedToCloud', '==', false);

    unUploadedFavItemImages.get().then((querySnapshot) => {
      querySnapshot.forEach((docSnapshot) => {
        // Upload first
        uploadOfflineImage(docSnapshot.data().picID).then((result) => {
          if (result) {
            // Change necessary db field to true (so we know it got uploaded)
            updateOfflineDatabaseField(docSnapshot.ref);
          }
        });
      });
    });

    // Retrieve query of offline meal item images
    let unUploadedImages = firebase
      .firestore()
      .collectionGroup('mealItems')
      .where('userID', '==', userID)
      .where('uploadedToCloud', '==', false);
    unUploadedImages.get().then((querySnapshot) => {
      querySnapshot.forEach((docSnapshot) => {
        // Upload first
        uploadOfflineImage(docSnapshot.data().picID).then((result) => {
          if (result) {
            // Change necessary db field to true (so we know it got uploaded)
            updateOfflineDatabaseField(docSnapshot.ref);
          }
        });
      });
    });
  } catch (e) {
    console.log(e);
  }
};

const uploadOfflineImage = async (imgID) => {
  // Generate picture path
  let picPath = `${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`;
  if (await checkIfFileIsCached(picPath)) {
    let result = await addPictureToCloud(imgID, picPath);
    return result;
  } else {
    return false;
  }
};

const updateOfflineDatabaseField = async (itemRef) => {
  itemRef.update({uploadedToCloud: true});
};

export const checkIfFileIsCached = async (filePath) => {
  let doesExist = await RNFetchBlob.fs.exists(filePath);
  return doesExist;
};

/**
 * Get ID of most recently added meal from DB or null
 *
 * @param current time stamp
 * @return: ID of most recently added meal from DB if was added within {30} minutes of current time,
 * otherwise return null
 */
export async function getMostRecentMealIfApplicable(mealItemTime, userID) {
  let id;
  let mostRecentMealQuery = firestore()
    .collection('users')
    .doc(userID) // need to change with Auth
    .collection('meals')
    .orderBy('mealStarted', 'desc')
    .limit(1);

  await mostRecentMealQuery.get().then((querySnapshots) => {
    if (
      querySnapshots.size == 0 ||
      querySnapshots.docs[0].get('mealStarted').seconds <
        mealItemTime.seconds - 10 // TODO: let user specify this value in settings
    ) {
      id = null;
    } else {
      id = querySnapshots.docs[0].id;
    }
  });

  return id;
}

export const getMealItem = async (item, itemID, mealID, isNetOnline) => {
  try {
    item.itemID = itemID;
    item.mealID = mealID;
    // Add necessary item data to AsyncStorage: timeCreated (milliseconds) - picID
    AsyncStorage.setItem(
      item.timeStamp.toDate().getTime().toString(),
      item.picID,
    );
    // Generate picture path
    let picPath = `${RNFetchBlob.fs.dirs.CacheDir}/${item.picID}`;
    let doesExist = await checkIfFileIsCached(picPath);
    if (doesExist) {
      // Load from Cache
      item.picPath = `file://${picPath}`;
    } else {
      // check if internet connection is working currently
      if (isNetOnline) {
        // get the download link
        let url = await handleObtainingDownloadUrl(item.picID);

        // Download file to cache folder
        await RNFetchBlob.config({path: picPath}).fetch('GET', url);
        item.picPath = `file://${picPath}`;
        console.log('Downloaded!');
      }
    }
    return item;
  } catch (e) {
    console.log(e);
    // Need to return the item to display at least white space
    return item;
  }
};

export const deleteMealItem = async (itemID, mealID, imgID, itemTime) => {
  try {
    let currentUser = firebase.auth().currentUser.uid;

    let state = await NetInfo.fetch();

    // Delete from DB
    await firebase
      .firestore()
      .collection('users')
      .doc(currentUser)
      .collection('meals')
      .doc(mealID)
      .collection('mealItems')
      .doc(itemID)
      .delete()
      .then(() => console.log('Deleted!'));

    let imgIDIsInUse = await checkIfFavMealPicInUse(currentUser, imgID);

    let deletedFromCloud = false;
    if (state.isConnected && state.isInternetReachable && !imgIDIsInUse) {
      // Delete from CloudStorage
      try {
        deletedFromCloud = await deletePictureFromCloud(imgID);
      } catch (e) {
        deletedFromCloud = false;
      }
    }
    console.log('Deleted successfully? - ' + deletedFromCloud);
    if (!deletedFromCloud && !imgIDIsInUse) {
      // Add a doc to collection (items marked for cloud storage deletion)
      firebase
        .firestore()
        .collection('users')
        .doc(currentUser)
        .collection('itemsToBeDeletedFromCloud')
        .add({
          picID: imgID,
          type: 'mealItem',
        })
        .then(() => console.log('Added to itemsToBeDeletedFromCloud'));
    }

    if (!imgIDIsInUse) {
      // Async storage before (JUST FOR TESTS)
      console.log('Async storage before');
      await AsyncStorage.getAllKeys((error, keys) => {
        keys.forEach((key) => console.log(key));
      });

      // Delete from Async Storage
      await AsyncStorage.removeItem(itemTime, (error) => {
        if (error) {
          console.log(error);
        }
      });
      console.log('Async storage after');
      await AsyncStorage.getAllKeys((error, keys) => {
        keys.forEach((key) => console.log(key));
      });

      // delete from cache
      await RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`);
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Add new meal item to DB. Either append it to existing Meal or create new meal item
 * based on the time elapsed from the creating of previous Meal
 */
export const addNewMealItem = async (
  imgID,
  imgDir,
  isAndroid,
  notes,
  userID,
  isNetOnline,
  reminders,
  wasAddedToFavorites,
) => {
  // Check to see if internet is reachable
  if (isNetOnline && !wasAddedToFavorites) {
    // add pic to Cloud
    addPictureToCloud(imgID, imgDir);
  }

  let mealItemTime = await firebase.firestore.Timestamp.now();
  let userRef = firestore()
    .collection('users')
    .doc(firebase.auth().currentUser.uid);

  // Determine if the meal item needs to be added as a New Meal or to an existing meal
  let mealID = await getMostRecentMealIfApplicable(mealItemTime, userID);
  let currentMealRef;
  if (mealID != null) {
    // existing
    currentMealRef = userRef.collection('meals').doc(mealID);
  } else {
    // new meal

    // Schedule after-meal notifications
    NotificationsController.scheduleAfterMealReminders(userID, reminders);

    currentMealRef = userRef.collection('meals').doc();
    // Add the start time of the meal and symptoms
    let mealData = {mealStarted: mealItemTime};

    // TODO: add a listener and pass in these boys once
    // Get all available symptoms
    let userSymptomsSnapshot = await userRef
      .collection('symptoms')
      .doc('userSymptoms')
      .get();

    // get the array of symptoms
    let userSymptoms = userSymptomsSnapshot.data().availableSymptoms;

    // Populate map with initial values
    let initSymptoms = {};

    userSymptoms.forEach((symptom) => {
      initSymptoms[symptom] = 0;
    });
    mealData.mealSymptoms = initSymptoms;
    currentMealRef.set(mealData);
  }

  // Add the new meal item
  currentMealRef
    .collection('mealItems')
    .add({
      userID: userID,
      picID: imgID,
      notes: notes,
      timeStamp: mealItemTime,
      uploadedToCloud: wasAddedToFavorites || isNetOnline, // to make sure we don't upload image twice to cloud if was added to favorites
      isAndroid: isAndroid,
      fromFavorites: wasAddedToFavorites, // needed for handling deletions in the future
    })
    .then(() => console.log('added new meal item!'));

  return currentMealRef.id;
};

export const addToFavorites = async (
  userID,
  picID,
  isAndroid,
  notes,
  isNetOnline,
  imgDir,
  wasFavoredAlready,
) => {
  // Check to see if internet is reachable
  let uploadedToCloud = false;
  if (isNetOnline && !wasFavoredAlready) {
    // If yes -> add pic to Cloud
    uploadedToCloud = await addPictureToCloud(picID, imgDir);
  }

  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('savedMealItems')
    .add({
      userID: userID,
      picID: picID,
      notes: notes,
      uploadedToCloud: wasFavoredAlready || uploadedToCloud,
      isAndroid: isAndroid,
    })
    .then(() => console.log('added to favorites'));
};

export const loadUncachedFavorites = async (favorites) => {
  favorites.forEach((item) => {
    let itemPicPath = `${RNFetchBlob.fs.dirs.CacheDir}/${item.picID}`;
    // check to see if it's cached
    checkIfFileIsCached(itemPicPath).then((result) => {
      console.log('---------------------------', result);
      if (!result) {
        // load from Cloud
        // get the download link
        handleObtainingDownloadUrl(item.picID).then((downloadURL) => {
          // Download file to cache folder
          RNFetchBlob.config({path: itemPicPath}).fetch('GET', downloadURL);
        });
      }
    });
  });
};

export const updateNotes = async (userID, favItemID, newNotes) => {
  await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('savedMealItems')
    .doc(favItemID)
    .update({notes: newNotes});
};

export const deleteFavMealItem = async (
  userID,
  favItemID,
  picID,
  isNetOnline,
) => {
  console.log('hmm...');
  await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('savedMealItems')
    .doc(favItemID)
    .delete();

  console.log('hmm...2');

  // TODO: Check if the item is in use anywhere by picID
  let isInUse = await checkIfFavMealPicInUse(userID, picID);

  console.log(isInUse);
  if (!isInUse) {
    // good to delete from Cloud and Cache and ignoring AsyncStorage for now
    console.log('not in use!');
    let deletedFromCloud = false;
    if (isNetOnline) {
      try {
        deletedFromCloud = await deletePictureFromCloud(picID);
      } catch (e) {}
    }

    console.log('deleted from cloud?:', deletedFromCloud);

    if (!deletedFromCloud) {
      // Add a doc to collection (items marked for cloud storage deletion)
      firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('itemsToBeDeletedFromCloud')
        .add({
          picID: picID,
          type: 'favMealItem',
        })
        .then(() => console.log('Added to itemsToBeDeletedFromCloud'));
    }
    // Ignore deleting from AsyncStorage for now since it's a pretty rare use-case and woun't break anythin
    // Plus not a very good design on my part

    // delete from cache
    await RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.CacheDir}/${picID}`);
  }

  return isInUse;
};

const checkIfFavMealPicInUse: boolean = async (userID, picID) => {
  console.log('here');

  let res = true;
  let queryItemsFromFavsSnapshot = await firebase
    .firestore()
    .collectionGroup('mealItems')
    .where('userID', '==', userID)
    .where('picID', '==', picID)
    .get();

  if (queryItemsFromFavsSnapshot.empty) {
    let queryFavsSnapshot = await firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('savedMealItems')
      .where('userID', '==', userID)
      .where('picID', '==', picID)
      .get();

    if (queryFavsSnapshot.empty) {
      res = false;
    }
  }

  console.log(res);
  return res;
};
