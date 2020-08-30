import firebase from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage';

export const addPictureToCloud = async (imgID, imgDir, userID) => {
  try {
    // add an image to the user's folder
    let task = await firebase
      .storage()
      .ref(`${userID}/${imgID}`)
      .putFile(imgDir);

    let didLoad;
    task.state === 'success' ? (didLoad = true) : (didLoad = false);
    return didLoad;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const deletePictureFromCloud = async (imgID, userID) => {
  try {
    // delete the image from user's folder
    let imageRef = firebase.storage().ref(`${userID}/${imgID}`);
    await imageRef.delete();

    // if no errors arise => success, otherwise catch below and return false
    return true;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const handleObtainingDownloadUrl = async (picID, userID) => {
  let firstDownloadSucceeded = true;
  let url;
  try {
    url = await storage().ref(`${userID}/${picID}`).getDownloadURL();
  } catch (e) {
    firstDownloadSucceeded = false;
  }

  if (!firstDownloadSucceeded) {
    // Try again
    await new Promise((resolve) =>
      setTimeout(() => resolve('waited sometime!'), 1000),
    );
    url = await storage().ref(`${userID}/${picID}`).getDownloadURL();
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
    deletePictureFromCloud(queryDocumentSnapshot.data().picID, userID)
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

export const deleteFolder = async (userID) => {
  try {
    let folderRef = firebase.storage().ref(userID + '/');
    folderRef.listAll().then((dir) => {
      dir.items.forEach((fileRef) => {
        fileRef.delete().catch(function (error) {
          // There has been an error
        });
      });
    });
  } catch (e) {
    console.log(e);
  }
};
