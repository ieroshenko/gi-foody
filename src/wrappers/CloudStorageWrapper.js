import firebase from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage';

export const addPictureToCloud = async (imgID, imgDir) => {
  try {
    let task = await firebase.storage().ref(imgID).putFile(imgDir);
    let didLoad;
    task.state === 'success' ? (didLoad = true) : (didLoad = false);
    return didLoad;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const deletePictureFromCloud = async (imgID) => {
  try {
    let imageRef = firebase.storage().ref(`/${imgID}`);
    await imageRef.delete();

    // if no errors arise => success, otherwise catch below and return false
    return true;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const handleObtainingDownloadUrl = async (picID) => {
  let firstDownloadSucceeded = true;
  let url;
  try {
    url = await storage().ref(picID).getDownloadURL();
  } catch (e) {
    firstDownloadSucceeded = false;
  }

  if (!firstDownloadSucceeded) {
    // Try again
    await new Promise((resolve) =>
      setTimeout(() => resolve('waited sometime!'), 1000),
    );
    url = await storage().ref(picID).getDownloadURL();
  }

  return url;
};

export const handleAnyQueuedCloudPicDeletions = async (userID) => {
  let querySnapshot = await firebase
    .firestore()
    .collection('users')
    .doc(userID)
    .collection('itemsToBeDeletedFromCloud')
    .get();

  querySnapshot.forEach((queryDocumentSnapshot) => {
    // Try deleting from Cloud Storage Again
    deletePictureFromCloud(queryDocumentSnapshot.data().picID)
      .then((result) => {
        if (result) {
          // Delete this queryDocument from database
          queryDocumentSnapshot.ref.delete();
        }
      })
      .catch((e) => {
        if (e.code === 'storage/object-not-found') {
          // Delete this queryDocument from database
          queryDocumentSnapshot.ref
            .delete()
            .then(() => console.log('deleted!'));
        }
      });
  });
};
