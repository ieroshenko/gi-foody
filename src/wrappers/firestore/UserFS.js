// add a default reminder (30 minutes after meal)
import {addReminderToDB} from './RemindersDBManagement';
import {firebase} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const sendEmailVerification = () => {
  let user = firebase.auth().currentUser;
  user
    .sendEmailVerification()
    .then(() => console.log('Sent the email verification'))
    .catch((e) => console.log(e.toString()));
};

export const initReminders = (userID) => {
  addReminderToDB(true, 'How do you feel?', '0:30', 'after', userID, []);
};

export const initSymptoms = async (userID) => {
  await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('symptoms')
    .doc('userSymptoms')
    .set({
      availableSymptoms: ['Bloating', 'Pain', 'Irritation', 'Nausea'],
    });
};

export const createNewDBUser = async (user) => {
  // check if user was already initialized before
  let userRef = firestore().collection('users').doc(user.uid);
  let querySnapshot = await userRef.get();
  // if not, initialize
  if (!querySnapshot.exists) {
    let initData = {
      mealNum: 0,
      combineMeals: 30,
      accType: 'FREE',
    };
    await userRef.set(initData);
    initReminders(user.uid);
    initSymptoms(user.uid);
  }
};
