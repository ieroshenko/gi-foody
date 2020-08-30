import firebase from '@react-native-firebase/app';
import {unscheduleReminder} from '../../services/LocalPushController';
import Database from '../sqlite/SqliteFasade';

export const addReminderToDB = async (
  isActive,
  message,
  time,
  type,
  userID,
  existingRems,
) => {
  let reminder = {
    type: type,
    time: time,
    message: message,
    isActive: isActive,
  };

  let uniqueNumID = generateUniqueID(existingRems);

  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('reminders')
    .doc(uniqueNumID)
    .set(reminder)
    .then(() => console.log('added a new reminder'));
};

const generateUniqueID = (existingRems) => {
  let isUnique = false;

  let milliseconds = Date.now().toString();
  let id = Date.now()
    .toString()
    .slice(milliseconds.length - 5); // 5 char long

  // test to make sure it's unique
  while (!isUnique) {
    let testArr = existingRems.filter((rem) => rem.id === id);
    if (testArr.length) {
      // generate a new one
      id = Date.now()
        .toString()
        .slice(milliseconds.length - 5);
    } else {
      break;
    }
  }

  return id;
};

export const updateReminderDB = async (
  isActive,
  message,
  time,
  type,
  userID,
  reminderID,
) => {
  // Delete the reminder from Notification center
  unscheduleReminder(reminderID);

  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('reminders')
    .doc(reminderID)
    .update({
      type: type,
      time: time,
      message: message,
      isActive: isActive,
    })
    .then(() => console.log('updated a new reminder'));
};

export const deleteReminderDB = async (userID, reminderID) => {
  firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('reminders')
    .doc(reminderID)
    .delete()
    .then(() => {
      unscheduleReminder(reminderID);
      Database.deleteReminder(reminderID).then(() => {
        console.log('deleted a reminder');
      });
    });
};

export const updateScheduledStatus = async (reminderID, isScheduled) => {
  // Update in sqlite
  await Database.updateReminder(reminderID, isScheduled);
};

export const deactivateAllActiveRems = async (userID) => {
  let activeRemsRef = firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('reminders')
    .where('isActive', '==', true);

  activeRemsRef.get().then((querySnapshot) => {
    let batch = firebase.firestore().batch();

    querySnapshot.docs.forEach((reminderDoc) => {
      batch.update(reminderDoc.ref, {isActive: false});
    });

    batch.commit().catch((err) => console.error(err));
  });
};
