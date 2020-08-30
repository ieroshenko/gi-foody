import React, {useEffect, useReducer, useState} from 'react';
import CameraView from './CameraView';
import Modal from 'react-native-modal';
import SavedMealItems from './SavedMealItems';
import {Platform, StyleSheet} from 'react-native';
import UserContext from '../../hooks/UserContext';
import firebase from '@react-native-firebase/app';
import {ImagePreview} from './PicturePreview';
import {loadUncachedFavorites} from '../../wrappers/firestore/FirebaseWrapper';

const AddNewHome = (props) => {
  const userID = React.useContext(UserContext);
  const [isSavedVis, setIsSavedVis] = useState(false);
  const [savedMeals, setSavedMeals] = useState([]);
  const [previewData, setPreviewData] = useState({
    imgUri: '',
    notes: '',
    fromFavorites: false,
    isPrevVis: false,
    isAndroid: Platform.OS === 'android',
  });

  useEffect(() => {
    let unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('savedMealItems')
      .onSnapshot((querySnapshot) => {
        let savedMeals = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // load uncached saved meals from cloud
        loadUncachedFavorites(savedMeals, userID).then(
          setSavedMeals(savedMeals),
        );
      });

    return () => unsubscribe();
  }, [userID]);

  const openSavedModal = () => {
    setIsSavedVis(true);
  };

  const closeSavedModal = () => {
    setIsSavedVis(false);
  };

  const openPreview = (imgUri, notes, fromFavorites, isAndroid) => {
    // close savedImagesView to try avoid conflict
    if (fromFavorites) {
      setIsSavedVis(false);
      setTimeout(() => {
        setPreviewData({
          ...previewData,
          imgUri: imgUri,
          notes: notes,
          fromFavorites: fromFavorites,
          isPrevVis: true,
          isAndroid: isAndroid,
        });
      }, 700);
    } else {
      setPreviewData({
        ...previewData,
        imgUri: imgUri,
        notes: notes,
        fromFavorites: fromFavorites,
        isPrevVis: true,
      });
    }
  };

  const closePreview = () => {
    setPreviewData({...previewData, isPrevVis: false});
  };

  return (
    <>
      <CameraView
        closeModal={props.closeModal}
        reminders={props.reminders}
        openSavedModal={openSavedModal}
        openPreview={openPreview}
      />
      <Modal
        style={styles.modalDefault}
        isVisible={isSavedVis}
        onBackdropPress={closeSavedModal}>
        <SavedMealItems
          closeSelf={closeSavedModal}
          savedMeals={savedMeals}
          openPreview={openPreview}
        />
      </Modal>
      <Modal
        isVisible={previewData.isPrevVis}
        style={styles.modalDefault}
        onBackdropPress={closePreview}>
        <ImagePreview
          imgUri={previewData.imgUri}
          notes={previewData.notes}
          fromFavorites={previewData.fromFavorites}
          isAndroid={previewData.isAndroid}
          onCloseClick={closePreview}
          reminders={props.reminders}
          combineMeals={props.combineMeals}
          symptoms={props.symptoms}
        />
      </Modal>
    </>
  );
};

export default AddNewHome;

const styles = StyleSheet.create({
  modalDefault: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
