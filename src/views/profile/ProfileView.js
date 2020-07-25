import React, {useState, useEffect} from 'react';
import SignInScreen from '../authentication/SignIn';
import Modal from 'react-native-modal';
import {
  Text,
  ScrollView,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {firebase} from '@react-native-firebase/auth';
import SignUpAnonymousScreen from '../authentication/SignUpAnonymous';
import {Icon} from 'react-native-elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import SettingsScreen from './Settings';
import awaitAsyncGenerator from '@babel/runtime/helpers/esm/awaitAsyncGenerator';
import UserContext from '../../hooks/UserContext';

const Stack = createStackNavigator();

const Profile = (props) => {
  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator>
        <Stack.Screen
          name="Profile"
          // initialParams={props.route.params}
          options={({navigation}) => ({
            title: '',
            headerLeft: (props) => (
              <HeaderLeft {...props} navigation={navigation} />
            ),
          })}>
          {() => <ProfileContent isAnonymous={props.isAnonymous} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {() => <SettingsScreen isAnonymous={props.isAnonymous} />}
        </Stack.Screen>
      </Stack.Navigator>
    </View>
  );
};

const Symptom = (props) => {
  return (
    <View style={styles.symptom}>
      <Text style={{fontSize: 16, fontFamily: 'System', fontWeight: '600'}}>
        {props.item}
      </Text>
      <TouchableOpacity
        onPress={() => props.deleteSymptom(props.item)}
        style={styles.sympIcon}>
        <Icon name="delete" color="#ff7d7d" size={28} />
      </TouchableOpacity>
    </View>
  );
};

const HeaderLeft = (props) => {
  return (
    <TouchableOpacity
      style={{marginLeft: 15}}
      onPress={() => props.navigation.navigate('Settings')}>
      <Icon name="settings" />
    </TouchableOpacity>
  );
};

const ProfileContent = (props) => {
  const [isAnonymous, setIsAnonymous] = useState(props.isAnonymous); //TODO: update
  const [isSignUpVisible, setIsSignUpVisible] = useState(false);
  const [isSignInVisible, setIsSignInVisible] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [newSympName, setNewSympName] = useState('');
  const userID = React.useContext(UserContext);

  useEffect(() => {
    // Get symptomSettings
    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('symptoms')
      .doc('userSymptoms')
      .get()
      .then((docSnapshot) => {
        setSymptoms(docSnapshot.data().availableSymptoms);
      });

    setIsAnonymous(props.isAnonymous);
  }, [props.isAnonymous, userID]);

  useEffect(() => {
    // Close SignIn Modal Window
    if (!isAnonymous) {
      closeSignInAnonymous();
    }
  }, [isAnonymous]);

  /**
   * Update user's account info (isAnonymous) manually, because of potential bug
   * with onAuthStateChanged listener and linkWithCredential fcns of firebase
   */
  const manuallyUpdateAnonymousState = () => {
    setIsAnonymous(false);
  };

  const signAnonymousUserUp = () => {
    setIsSignUpVisible(true);
  };

  const closeSignUpAnonymous = () => {
    setIsSignUpVisible(false);
  };

  const closeSignInAnonymous = () => {
    setIsSignInVisible(false);
  };

  const addSymptom = () => {
    // Check if input is not empty (Alert)
    if (newSympName.length === 0) {
      Alert.alert('Wait a second...', "Don't forget to enter symptom name :P");
    } else if (symptoms.includes(newSympName)) {
      Alert.alert(
        'An error',
        'It looks like a symptom with the same name already exists',
      );
    } else {
      let updatedSymps = [...symptoms, ...[newSympName]];
      // Change the state
      setSymptoms(updatedSymps);
      setNewSympName('');
      // Update DB as well
      firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('symptoms')
        .doc('userSymptoms')
        .update({availableSymptoms: updatedSymps})
        .then(() =>
          Alert.alert(
            'New symptom was added!',
            'You will be able to track it starting your next meal.',
          ),
        );
    }
  };

  const deleteSymptom = (sympID) => {
    let updatedSymps = symptoms.filter((symptomID) => symptomID !== sympID);
    setSymptoms(updatedSymps);

    // Update DB as well
    firebase
      .firestore()
      .collection('users')
      .doc(userID)
      .collection('symptoms')
      .doc('userSymptoms')
      .update({availableSymptoms: updatedSymps})
      .then(() => console.log('Yay!'));
  };

  return (
    <ScrollView>
      {isAnonymous ? (
        <View>
          <TouchableOpacity
            style={{backgroundColor: 'blue'}}
            onPress={signAnonymousUserUp}>
            <Text>Sign the fuck up!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{backgroundColor: 'red'}}
            onPress={() => setIsSignInVisible(true)}>
            <Text>Or sign the fuck in</Text>
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
                style={{
                  fontSize: 16,
                  fontFamily: 'System',
                  fontWeight: '600',
                  alignSelf: 'center',
                  width: '90%',
                }}
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
          <SignUpAnonymousScreen
            closeModal={closeSignUpAnonymous}
            updateUserAnonStatus={manuallyUpdateAnonymousState}
          />
          <View
            style={{
              position: 'absolute',
              alignItems: 'flex-end',
              width: '100%',
              marginTop: useSafeAreaInsets().top,
            }}>
            <TouchableOpacity
              style={{marginRight: 10, marginTop: 5}}
              onPress={() => closeSignUpAnonymous()}>
              <Icon
                name="close"
                size={40}
                color="gray"
                style={{
                  marginRight: 15,
                  marginTop: 15,
                  borderRadius: 20,
                  backgroundColor: '#e0e0e0',
                }}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        style={{
          justifyContent: 'flex-start',
          margin: 0,
        }}
        backdropOpacity={0.5}
        isVisible={isSignInVisible}
        transparent={true}
        onBackdropPress={() => setIsSignInVisible(false)}>
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
          <SignInScreen />
          <View
            style={{
              position: 'absolute',
              alignItems: 'flex-end',
              width: '100%',
              marginTop: useSafeAreaInsets().top,
            }}>
            <TouchableOpacity
              style={{marginRight: 10, marginTop: 5}}
              onPress={() => closeSignInAnonymous()}>
              <Icon
                name="close"
                size={40}
                color="gray"
                style={{
                  marginRight: 15,
                  marginTop: 15,
                  borderRadius: 20,
                  backgroundColor: '#e0e0e0',
                }}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
};

export default Profile;

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
});
