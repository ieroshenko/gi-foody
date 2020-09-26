import Database from '../sqlite/SqliteFasade';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

export const addNewMeal = async (
  userId,
  mealRef,
  mealItemTime,
  userSymptoms,
) => {
  // Add the start time of the meal and symptoms
  let mealData = {
    mealStarted: mealItemTime,
    symptomNotes: '',
    lastUpdated: mealItemTime.toDate().getTime(), //// get time in mseconds
  };

  // Populate map with initial values
  let initSymptoms = {};

  userSymptoms.forEach((symptom) => {
    initSymptoms[symptom] = 0;
  });
  mealData.mealSymptoms = initSymptoms;
  mealRef.set(mealData);
};

export const updateSymptomNotes = async (userID, mealID, note) => {
  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('meals')
    .doc(mealID)
    .update({symptomNotes: note, lastUpdated: Date.now()})
    .then(() => console.log('Updated symptom note'));
};

export const updateSymptomValue = async (userID, mealID, sympID, sympValue) => {
  let fieldMapToBeUpdated = {lastUpdated: Date.now()};
  fieldMapToBeUpdated[`mealSymptoms.${sympID}`] = sympValue;

  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('meals')
    .doc(mealID)
    .update(fieldMapToBeUpdated)
    .then(() => console.log('updated symptom value'));
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

    let mealUpdate = {lastUpdated: Date.now()};
    mealUpdate[`mealSymptoms.${symptomName}`] = 0;

    await actualMealRef.update(mealUpdate);
  }
};

export const deleteMealDB = async (userID, mealID) => {
  let userRef = firebase.firestore().collection('users').doc(userID);

  // delete from Firestore
  await userRef.collection('meals').doc(mealID).delete();

  // add it to delete history so sqlite on clients know that they need to fetch
  await userRef
    .collection('deletedMeals')
    .add({mealID: mealID, lastUpdated: Date.now()});
};

/**
 * Fetches necessary meal data from firestore to SQLite to be up-to-date
 * @param userID
 * @return {Promise<R>}: List of all Meals
 */
export const fetchMealData = async (userID) => {
  let allFetchedMeals = [];
  let sqlUser = await Database.checkIfUserExists(userID);
  let fetchTime: number = Date.now(); // mseconds

  if (sqlUser) {
    let lastFetchedMS = sqlUser.lastFetched; // get the time in mseconds of the last fetch
    let userRef = firebase.firestore().collection('users').doc(userID);

    // fetch meal update data (add / update)
    let hasFetchedUpdates: boolean = await fetchUpdates(
      userID,
      userRef,
      lastFetchedMS,
    );

    // after that, fetch meal deletion data
    let hasFetchedDeletions: boolean = await fetchDeletions(
      userID,
      userRef,
      lastFetchedMS,
    );

    if (hasFetchedUpdates || hasFetchedDeletions) {
      // update last fetched property of a user
      await Database.updateUserLastFetchedProp(userID, fetchTime);
    }

    // get all meals and return them
    allFetchedMeals = await Database.getAllMeals(userID);
  }

  return allFetchedMeals;
};

export const getMostRecentMealIfApplicable = async (
  mealItemTime,
  userID,
  combineMeals,
) => {
  let id;
  let mostRecentMealQuery = firestore()
    .collection('users')
    .doc(userID) // need to change with Auth
    .collection('meals')
    .orderBy('mealStarted', 'desc')
    .limit(1);

  let querySnapshots = await mostRecentMealQuery.get();

  if (
    querySnapshots.size == 0 ||
    querySnapshots.docs[0].get('mealStarted').seconds <
      mealItemTime.seconds - combineMeals * 60 //
  ) {
    id = null;
  } else {
    id = querySnapshots.docs[0].id;
  }

  return id;
};

const fetchUpdates: boolean = async (
  userID,
  userRef,
  lastFetchedLocally: number,
) => {
  let hasFetched = false;

  // see if there are any new updates since then (add / update)
  let mealsToBeFetchedSnapshot = await userRef
    .collection('meals')
    .where('lastUpdated', '>', lastFetchedLocally)
    .get();

  // if updates happened since last fetch
  if (!mealsToBeFetchedSnapshot.empty) {
    let mealsToBeFetchedDocs = mealsToBeFetchedSnapshot.docs;
    for (let i = 0; i < mealsToBeFetchedDocs.length; i++) {
      let meal = mealsToBeFetchedDocs[i].data();
      // add to database
      await Database.addOrReplaceMeal(
        userID,
        mealsToBeFetchedDocs[i].id,
        meal.mealStarted.toDate().getTime(),
        meal.symptomNotes,
        meal.mealSymptoms,
      );
    }

    console.log('---_____----- fetched updates');

    hasFetched = true;
  }

  return hasFetched;
};

const fetchDeletions: boolean = async (
  userID,
  userRef,
  lastFetchedLocally: number,
) => {
  let hasFetched = false;

  let delsToBeFetchedSnapshot = await userRef
    .collection('deletedMeals')
    .where('lastUpdated', '>', lastFetchedLocally)
    .get();

  if (!delsToBeFetchedSnapshot.empty) {
    let delsToBeFetchedDocs = delsToBeFetchedSnapshot.docs;
    for (let i = 0; i < delsToBeFetchedDocs.length; i++) {
      let id = delsToBeFetchedDocs[i].data().mealID;
      // delete the meal in SQLite
      await Database.deleteMeal(userID, id);
    }

    console.log('---_____-----_______ fetched deletions');
    hasFetched = true;
  }

  return hasFetched;
};
