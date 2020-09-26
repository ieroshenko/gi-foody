import storage from '@react-native-firebase/storage';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import RNFetchBlob from 'rn-fetch-blob';
import NetInfo from '@react-native-community/netinfo';
import * as NotificationsController from '../../services/LocalPushController';
import {
  addPictureToCloud,
  deletePictureFromCloud,
  handleObtainingDownloadUrl,
  deleteFolder,
} from '../CloudStorageWrapper';
import Database from '../sqlite/SqliteFasade';
import * as MealHandler from './MealFS';
import MealItemObj from '../../entities/MealItemObj';

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
        uploadOfflineImage(docSnapshot.data().picID, userID).then((result) => {
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
        uploadOfflineImage(docSnapshot.data().picID, userID).then((result) => {
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

const uploadOfflineImage = async (imgID, userID) => {
  // Generate picture path
  let picPath = `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${imgID}`;
  if (await checkIfFileIsCached(picPath)) {
    let result = await addPictureToCloud(imgID, picPath, userID);
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

export const getMealItemImgUri = async (userID, picID) => {
  let picPath = `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${picID}`;
  let doesExist = await checkIfFileIsCached(picPath);

  if (!doesExist) {
    // get the download link
    let url = await handleObtainingDownloadUrl(picID, userID);

    // Download file to cache folder
    await RNFetchBlob.config({path: picPath}).fetch('GET', url);
    console.log('Downloaded img!');
  }
};

/**
 * Get meal items corresponding given userId and mealID
 * @param userId
 * @param mealId
 * @return {Promise<void>}
 */
export const getMealItems: [] = async (userId, mealId) => {
  let mealItems = [];

  let mItemsSnapshot = await firebase
    .firestore()
    .collection('users')
    .doc(userId)
    .collection('meals')
    .doc(mealId)
    .collection('mealItems')
    .orderBy('timeStamp', 'desc')
    .get();

  if (!mItemsSnapshot.empty) {
    mealItems = mItemsSnapshot.docs.map((mItemDoc) => {
      // build the meal item with the id
      let data = mItemDoc.data();

      let mealItem = new MealItemObj.Builder(userId, mItemDoc.id, mealId)
        .withPicID(data.picID)
        .withNotes(data.notes)
        .withTimeStamp(data.timeStamp)
        .setFromFavorites(data.fromFavorites)
        .setIsAndroid(data.isAndroid)
        .setUploadedToCloud(data.uploadedToCloud)
        .build();

      //mealItem.handleImgDownload(); // handle async

      return mealItem;
    });
  }

  return mealItems;
};

export const deleteMealItem = async (
  itemID,
  mealID,
  imgID,
  itemTime,
  userID,
) => {
  try {
    let state = await NetInfo.fetch();

    // Delete from DB
    await firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('meals')
      .doc(mealID)
      .collection('mealItems')
      .doc(itemID)
      .delete()
      .then(() => console.log('Deleted meal item!'));

    let imgIDIsInUse = await checkIfFavMealPicInUse(userID, imgID);

    let deletedFromCloud = false;
    if (state.isConnected && state.isInternetReachable && !imgIDIsInUse) {
      // Delete from CloudStorage
      try {
        deletedFromCloud = await deletePictureFromCloud(imgID, userID);
      } catch (e) {
        deletedFromCloud = false;
      }
    }
    if (!deletedFromCloud && !imgIDIsInUse) {
      // Add a doc to collection (items marked for cloud storage deletion)
      firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('itemsToBeDeletedFromCloud')
        .add({
          picID: imgID,
          type: 'mealItem',
        })
        .then(() => console.log('Added to itemsToBeDeletedFromCloud'));
    }

    if (!imgIDIsInUse) {
      // delete from cache
      await RNFetchBlob.fs.unlink(
        `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${imgID}`,
      );
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Add new meal item to DB. Either append it to existing Meal or create new meal item
 * based on the time elapsed from the creating of previous Meal
 */
export const addNewMealItem: boolean = async (
  imgID,
  imgDir,
  isAndroid,
  notes,
  userID,
  isNetOnline,
  reminders,
  wasAddedToFavorites,
  combineMeals,
  userSymptoms,
) => {
  let isNewMeal = false;

  // Check to see if internet is reachable
  if (isNetOnline && !wasAddedToFavorites) {
    // add pic to Cloud
    addPictureToCloud(imgID, imgDir, userID);
  }

  let mealItemTime = await firebase.firestore.Timestamp.now();
  let userRef = firestore().collection('users').doc(userID);

  // Determine if the meal item needs to be added as a New Meal or to an existing meal
  let mealID = await getMostRecentMealIfApplicable(
    mealItemTime,
    userID,
    combineMeals,
  );
  let currentMealRef;
  if (mealID != null) {
    // existing
    currentMealRef = userRef.collection('meals').doc(mealID);
  } else {
    // new meal
    isNewMeal = true;
    // Schedule after-meal notifications
    NotificationsController.scheduleAfterMealReminders(userID, reminders);

    currentMealRef = userRef.collection('meals').doc();
    await addNewMeal(userID, currentMealRef, mealItemTime, userSymptoms);
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

  return isNewMeal;
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
    uploadedToCloud = await addPictureToCloud(picID, imgDir, userID);
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

export const loadUncachedFavorites = async (favorites, userID) => {
  favorites.forEach((item) => {
    let itemPicPath = `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${item.picID}`;
    // check to see if it's cached
    checkIfFileIsCached(itemPicPath).then((result) => {
      if (!result) {
        // load from Cloud
        // get the download link
        handleObtainingDownloadUrl(item.picID, userID).then((downloadURL) => {
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
  await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('savedMealItems')
    .doc(favItemID)
    .delete();

  // Check if the item is in use anywhere by picID
  let isInUse = await checkIfFavMealPicInUse(userID, picID);
  if (!isInUse) {
    // good to delete from Cloud and Cache and ignoring AsyncStorage for now
    let deletedFromCloud = false;
    if (isNetOnline) {
      try {
        deletedFromCloud = await deletePictureFromCloud(picID, userID);
      } catch (e) {}
    }

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
    await RNFetchBlob.fs.unlink(
      `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${picID}`,
    );
  }

  return isInUse;
};

const checkIfFavMealPicInUse: boolean = async (userID, picID) => {
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
  return res;
};

// delete user from DB, cloud storage
export const deleteUser = async (userID) => {
  // DB
  await firebase.firestore().collection('users').doc(userID).delete();

  deleteFolder(userID).then(() => {
    console.log('deleted folder it!');
  });
};

///////////////////////////////////////// MEALS FASADE //////////////////////////////////////////////

const addNewMeal = async (userId, mealRef, mealItemTime, userSymptoms) => {
  await MealHandler.addNewMeal(userId, mealRef, mealItemTime, userSymptoms);
};

export const updateSymptomNotes = async (userID, mealID, note) => {
  await MealHandler.updateSymptomNotes(userID, mealID, note);
};

export const updateSymptomValue = async (userID, mealID, sympID, sympValue) => {
  await MealHandler.updateSymptomValue(userID, mealID, sympID, sympValue);
};

/**
 * Fcn to add a new symptom, once it is added from Profile view to the most recent meal in journal
 * @param userID
 * @param symptomName
 * @return {Promise<void>}
 */
export const updateMostRecentMealsSymptoms = async (userID, symptomName) => {
  await MealHandler.updateMostRecentMealsSymptoms(userID, symptomName);
};

export const deleteMealDB = async (userID, mealID) => {
  await MealHandler.deleteMealDB(userID, mealID);
};

/**
 * Get ID of most recently added meal from DB or null
 *
 * @param current time stamp
 * @return: ID of most recently added meal from DB if was added within {30} minutes of current time,
 * otherwise return null
 */
export const getMostRecentMealIfApplicable = async (
  mealItemTime,
  userID,
  combineMeals,
) => {
  return await MealHandler.getMostRecentMealIfApplicable(
    mealItemTime,
    userID,
    combineMeals,
  );
};

export const fetchMealData = async (userID) => {
  return await MealHandler.fetchMealData(userID);
};
