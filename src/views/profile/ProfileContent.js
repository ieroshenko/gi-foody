import React, {useEffect, useMemo, useState, useRef} from 'react';
import UserContext from '../../hooks/UserContext';
import {firebase} from '@react-native-firebase/auth';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Symptom from './Symptom';
import {Icon} from 'react-native-elements';
import Modal from 'react-native-modal';
import SignUpAnonymousScreen from '../authentication/SignUpAnonymous';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SignInScreen from '../authentication/SignIn';
import {updateMostRecentMealsSymptoms} from '../../wrappers/firestore/FirebaseWrapper';

const ProfileContent = (props) => {
  const [isSignUpVisible, setIsSignUpVisible] = useState(false);
  const [isSignInVisible, setIsSignInVisible] = useState(false);
  const symptoms = props.symptoms;
  const [newSympName, setNewSympName] = useState('');
  const userID = React.useContext(UserContext);
  const anonUserId = useRef(userID);

  const signAnonymousUserUp = () => {
    setIsSignUpVisible(true);
  };

  const closeSignUpAnonymous = () => {
    setIsSignUpVisible(false);
  };

  const closeSignInAnonymous = () => {
    setIsSignInVisible(false);
  };

  useMemo(() => {
    if (!props.isAnonymous) {
      closeSignInAnonymous();
    }
  }, [props.isAnonymous]);

  const addSymptom = () => {
    // Check if input is not empty (Alert)
    if (newSympName.length === 0) {
      Alert.alert('Wait a second...', "Don't forget to enter symptom name :P");
    } else if (symptoms.includes(newSympName)) {
      Alert.alert(
        'An error',
        'It looks like a symptom with the same name already exists',
      );
    } else if (newSympName.includes('/')) {
      Alert.alert('Can not use forward slash', '"/" can not be used');
    } else if (newSympName.includes('.')) {
      Alert.alert('Please do not use dots', 'Cannot use dots in symptom name');
    } else {
      let updatedSymps = [...symptoms, ...[newSympName]];
      //   // Change the state
      //   setSymptoms(updatedSymps);
      setNewSympName('');
      // Update DB as well
      try {
        firebase
          .firestore()
          .collection('users')
          .doc(userID)
          .collection('symptoms')
          .doc('userSymptoms')
          .update({availableSymptoms: updatedSymps})
          .then(() => {
            console.log('new symp was added');
            // update most recent meal
            updateMostRecentMealsSymptoms(userID, newSympName)
              .then(() => console.log('updated most recent meal symptom'))
              .catch((error) => {
                if (error) {
                  Alert.alert(
                    'Something went wrong',
                    'Make sure symptom name does not contain any weird symbols',
                  );
                }
              });
          });
      } catch (e) {
        Alert.alert(
          'Something went wrong',
          'Make sure symptom name does not contain any weird symbols',
        );
      }
    }
  };

  const deleteSymptom = (sympID) => {
    let updatedSymps = symptoms.filter((symptomID) => symptomID !== sympID);

    // Update DB as well
    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('symptoms')
      .doc('userSymptoms')
      .update({availableSymptoms: updatedSymps})
      .then(() => console.log('Deleted symptom!'));
  };

  return (
    <ScrollView>
      {props.isAnonymous ? (
        <View style={styles.anonymButtonsContainer}>
          <Text
            style={[
              styles.textSubheader,
              {alignSelf: 'center', marginBottom: 10},
            ]}>
            Sign up to safely back up your data
          </Text>
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={signAnonymousUserUp}>
            <Text style={styles.signUpTxt}>Sign up!</Text>
          </TouchableOpacity>
          <Text style={styles.signInTxt}>or</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => setIsSignInVisible(true)}>
            <Text
              style={[styles.signInTxt, {color: '#7d8aff', fontWeight: '600'}]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.contentContainer}>
        <View style={styles.symptomBlock}>
          <Text style={styles.textSubheader}>Symptoms you track</Text>
          <View style={styles.sympItemsContainer}>
            <FlatList
              data={symptoms}
              renderItem={({item}) => (
                <Symptom item={item} deleteSymptom={deleteSymptom} />
              )}
              keyExtractor={(item, index) => item}
              scrollEnabled={false}
            />
            <View style={styles.symptom}>
              <TextInput
                style={styles.newSymp}
                onChangeText={(text) => {
                  setNewSympName(text);
                }}
                autoCapitalize="sentences"
                placeholder="Add a new symptom to track"
                autoCorrect={false}
                value={newSympName}
              />
              <TouchableOpacity onPress={addSymptom} style={styles.sympIcon}>
                <Icon name="add-circle" color="#7dff7d" size={28} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <Modal
        style={{
          justifyContent: 'flex-start',
          margin: 0,
        }}
        backdropOpacity={0.5}
        isVisible={isSignUpVisible}
        transparent={true}
        onBackdropPress={() => setIsSignUpVisible(false)}>
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
          <View style={styles.emptyHeaderPlaceholder} />
          <SignUpAnonymousScreen
            closeModal={closeSignUpAnonymous}
            updateUserAnonStatus={props.unAnonymize}
          />
          <View
            style={[styles.headerModal, {marginTop: useSafeAreaInsets().top}]}>
            <TouchableOpacity
              style={{marginRight: 10, marginTop: 5}}
              onPress={() => closeSignUpAnonymous()}>
              <Icon
                name="close"
                size={40}
                color="gray"
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        style={styles.defaultModal}
        backdropOpacity={0.5}
        isVisible={isSignInVisible}
        transparent={true}
        onBackdropPress={() => setIsSignInVisible(false)}>
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
          <View style={styles.emptyHeaderPlaceholder} />
          <SignInScreen
            anonUserId={props.isAnonymous ? anonUserId.current : null}
          />
          <View
            style={[styles.headerModal, {marginTop: useSafeAreaInsets().top}]}>
            <TouchableOpacity
              style={{marginRight: 10, marginTop: 5}}
              onPress={closeSignInAnonymous}>
              <Icon
                name="close"
                size={40}
                color="gray"
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
};

export default ProfileContent;

const styles = StyleSheet.create({
  contentContainer: {flex: 1, alignItems: 'center'},
  symptomBlock: {
    width: '95%',
    alignItems: 'flex-start',
    marginTop: 30,
  },
  sympItemsContainer: {
    backgroundColor: 'white',
    width: '100%',
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#ebebeb',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  textSubheader: {
    fontSize: 20,
    fontWeight: '700',
  },
  addNewSymp: {
    marginTop: 10,
    width: '100%',
    height: 40,
    borderRadius: 15,
    backgroundColor: '#7dff7d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewTxt: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 13,
  },
  newSymp: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    alignSelf: 'center',
    width: '90%',
  },
  defaultModal: {justifyContent: 'flex-start', margin: 0},
  headerModal: {
    position: 'absolute',
    alignItems: 'flex-end',
    width: '100%',
  },
  closeIcon: {
    marginRight: 15,
    marginTop: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  anonymButtonsContainer: {
    marginTop: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  signUpBtn: {
    width: '60%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7d8aff',
    borderRadius: 10,
    marginBottom: 5,
    marginTop: 5,
  },
  signUpTxt: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  signInTxt: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
  },
  signInBtn: {
    marginTop: 5,
  },
  symptom: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    backgroundColor: 'white',
  },
  sympIcon: {
    height: 30,
    width: 30,
  },
  emptyHeaderPlaceholder: {marginTop: 50},
});
