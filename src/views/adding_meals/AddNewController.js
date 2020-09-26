import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Icon} from 'react-native-elements';
import CameraView from './CameraView';
import SavedMealItems from './SavedMealItems';
import AddNewHome from './AddNewHome';

export const CameraModalScreen = (props) => {
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  const closeCameraModal = () => {
    setIsCameraVisible(false);
  };

  return (
    <View style={{flex: 1, alignSelf: 'center', justifyContent: 'center'}}>
      <TouchableOpacity
        backdropOpacity={0.1}
        backdropColor={'white'}
        activeOpacity={1}
        onPress={() => {
          setIsCameraVisible(true);
        }}
        style={{
          height: 60,
          width: 60,
          alignSelf: 'center',
          alignItems: 'center',
        }}>
        <Icon name={'add-circle'} size={60} color={'#FFA500'} />
      </TouchableOpacity>
      <Modal
        backdropOpacity={0.5} //TODO: update it later
        transparent={true}
        isVisible={isCameraVisible}
        onBackdropPress={() => setIsCameraVisible(false)}
        style={styles.modalDefault}>
        <AddNewHome
          closeModal={closeCameraModal}
          reminders={props.reminders}
          combineMeals={props.combineMeals}
          symptoms={props.symptoms}
          addNewMealItemToJournal={props.addMealItemToJournal}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalDefault: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
