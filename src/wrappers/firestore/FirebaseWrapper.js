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

/**
 * Get ID of most recently added meal from DB or null
 *
 * @param current time stamp
 * @return: ID of most recently added meal from DB if was added within {30} minutes of current time,
 * otherwise return null
 */
export async function getMostRecentMealIfApplicable(
  mealItemTime,
  userID,
  combineMeals,
) {
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
        mealItemTime.seconds - combineMeals * 60 //
    ) {
      id = null;
    } else {
      id = querySnapshots.docs[0].id;
    }
  });

  return id;
}

export const getMealItemImgUri = async (userID, picID) => {
  let returnPicPath = '';

  let picPath = `${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${picID}`;
  let doesExist = await checkIfFileIsCached(picPath);

  if (!doesExist) {
    // get the download link
    let url = await handleObtainingDownloadUrl(picID, userID);

    // Download file to cache folder
    await RNFetchBlob.config({path: picPath}).fetch('GET', url);
    console.log('Downloaded img!');
  }

  returnPicPath = `file://${picPath}`;

  return returnPicPath;
};

export const getMealItem = async (
  item,
  itemID,
  mealID,
  isNetOnline,
  userID,
) => {
  try {
    item.itemID = itemID;
    item.mealID = mealID;
    // Generate picture path
    item.picPath = await getMealItemImgUri(userID, item.picID);

    return item;
  } catch (e) {
    console.log(e);
    // Need to return the item to display at least white space
    return item;
  }
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
export const addNewMealItem = async (
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

    // increment count
    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .update('mealNum', firebase.firestore.FieldValue.increment(1));

    // Schedule after-meal notifications
    NotificationsController.scheduleAfterMealReminders(userID, reminders);

    currentMealRef = userRef.collection('meals').doc();
    // Add the start time of the meal and symptoms
    let mealData = {mealStarted: mealItemTime, symptomNotes: ''};

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

export const updateSymptomNotes = async (userID, mealID, note) => {
  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('meals')
    .doc(mealID)
    .update({symptomNotes: note})
    .then(() => console.log('Updated symptom note'));
};

export const fetchMealData = async (userID) => {
  return new Promise((resolve) => {
    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .get()
      .then((userDoc) => {
        // if not empty
        if (userDoc.data) {
          let mealCount = userDoc.data().mealNum;

          Database.getAllMeals(userID).then((localMeals) => {
            let localMealCount = localMeals.length;
            if (localMealCount < mealCount) {
              console.log('fetching from firebase');
              // fetch
              firebase
                .firestore()
                .collection('users')
                .doc(userID)
                .collection('meals')
                .orderBy('mealStarted', 'desc')
                .get()
                .then((querySnapshot) => {
                  console.log('meals fetched:', querySnapshot.docs.length);
                  let fetchedMeals = querySnapshot.docs.map(
                    (mealDocSnapshot) => {
                      let meal = mealDocSnapshot.data();

                      let mealStarted = meal.mealStarted.toDate().getTime();
                      // fetch data and add to DB (expensive)
                      Database.addNewMeal(
                        userID,
                        mealDocSnapshot.id,
                        mealStarted,
                        meal.symptomNotes,
                        meal.mealSymptoms,
                      );

                      let fetchedMeal = {
                        ...meal,
                        mealStarted: mealStarted,
                        id: mealDocSnapshot.id,
                      };

                      return fetchedMeal;
                    },
                  );

                  resolve(fetchedMeals);
                });
            } else {
              resolve(localMeals);
            }
          });
        }
      });
  });
  // if SQLite meal data is empty, make firestore query
};

export const deleteMealDB = async (userID, mealID) => {
  // delete from SQLite
  await Database.deleteMeal(userID, mealID);

  // delete from Firestore
  await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('meals')
    .doc(mealID)
    .delete();

  // decrement count
  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .update('mealNum', firebase.firestore.FieldValue.increment(-1));
};

// delete user from DB, cloud storage
export const deleteUser = async (userID) => {
  // DB
  await firebase.firestore().collection('users').doc(userID).delete();

  deleteFolder(userID).then(() => {
    console.log('deleted folder it!');
  });
};

export const updateMostRecentMealsSymptoms = async (userID, symptomName) => {
  let mostRecMealRef = firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('meals')
    .orderBy('mealStarted', 'desc')
    .limit(1);

  let snapshot = await mostRecMealRef.get();
  if (!snapshot.empty) {
    let actualMealRef = snapshot.docs[0].ref;

    let mealUpdate = {};
    mealUpdate[`mealSymptoms.${symptomName}`] = 0;

    await actualMealRef.update(mealUpdate);
  }
};
