import React, {useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {LoginManager, AccessToken} from 'react-native-fbsdk';
import auth, {firebase} from '@react-native-firebase/auth';
import Modal from 'react-native-modal';
import firestore from '@react-native-firebase/firestore';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

export const sendEmailVerification = () => {
  let user = firebase.auth().currentUser;
  user
    .sendEmailVerification()
    .then(() => console.log('Sent the email verification'))
    .catch((e) => console.log(e.toString()));
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

const createNewDBUser = async (user) => {
  let initData = {
    mealNum: 0,
  };
  await firestore().collection('users').doc(user.uid).set(initData);
  initSymptoms(user.uid);
};

const SignUpScreen = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValid, setValid] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const facebookSignUp = async () => {
    try {
      setModalVisible(true);
      // Attempt login with permissions
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
      ]);

      if (result.isCancelled) {
        throw 'Facebook login process was cancelled';
      }

      // Once signed in, get the user's AccessToken
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw 'Something went wrong obtaining access token. Please, try again';
      }

      // Create a Firebase credential with the AccessToken
      const facebookCredential = firebase.auth.FacebookAuthProvider.credential(
        data.accessToken,
      );

      // Sign-in the user with the credential
      let response = await firebase
        .auth()
        .signInWithCredential(facebookCredential);
      if (response && response.user) {
        await createNewDBUser(response.user);
        setModalVisible(false);
        Alert.alert('Yep', 'Signed Up/In!');
      }
    } catch (e) {
      setError(e);
      setModalVisible(false);
    }
  };

  const doCreateUser = async (email, password) => {
    try {
      setModalVisible(true);
      let response = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);
      if (response && response.user) {
        //success
        sendEmailVerification();
        await createNewDBUser(response.user);
        setModalVisible(false);
      }
    } catch (e) {
      let errorString = e.toString().split(']')[1];
      setError(errorString);
      setValid(false);
      setModalVisible(false);
    }
  };

  const doSignUp = () => {
    if (!email) {
      setError('Email required *');
      setValid(false);
      return;
    } else if (!password && password.trim() && password.length > 6) {
      setError('Weak password, minimum 5 chars');
      setValid(false);
      return;
    } else if (!isValidEmail(email)) {
      setError('Invalid Email');
      setValid(false);
      return;
    } else {
      setError('');
      setValid(true);
    }

    doCreateUser(email, password);
  };

  /**
   * Check to make sure emails is valid
   * @return {boolean}
   */
  const isValidEmail = (email) => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Let's get started</Text>
        </View>
        <View style={styles.formContainerStyle}>
          <TextInput
            label={'Email'}
            keyboardType="email-address"
            style={styles.textInputStyle}
            placeholder="Mail address"
            onChangeText={(text) => {
              setError;
              setEmail(text);
            }}
            autoCapitalize="none"
            error={isValid}
          />

          <TextInput
            label={'Password'}
            secureTextEntry
            style={styles.textInputStyle}
            selectionColor={blue}
            placeholder="Password"
            error={isValid}
            autoCapitalize="none"
            onChangeText={(text) => setPassword(text)}
          />
        </View>
        {error ? (
          <View style={styles.errorLabelContainerStyle}>
            <Text style={styles.errorTextStyle}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.buttonsContainerStyle}>
          <TouchableHighlight
            style={styles.signInValidButtonStyle}
            onPress={doSignUp}
            underlayColor={blue}>
            <Text style={styles.getStartedTextStyle}>GET STARTED</Text>
          </TouchableHighlight>
          <Text style={styles.textOr}>OR</Text>
          <TouchableHighlight
            style={styles.facebookButtonStyle}
            onPress={facebookSignUp}
            underlayColor={blue}>
            <Text style={styles.getStartedTextStyle}>
              SIGN UP WITH FACEBOOK
            </Text>
          </TouchableHighlight>
          <Text style={styles.privacyPolicyText}>
            By continuing, you agree to GI-Foody's Terms & Conditions and
            Privacy Policy
          </Text>
        </View>
        <Modal
          backdropOpacity={0.5} //TODO: update it later
          isVisible={modalVisible}
          transparent={true}
          onBackdropPress={() => setModalVisible(false)}>
          <ActivityIndicator
            style={{alignSelf: 'center'}}
            size="large"
            color="white"
          />
        </Modal>
      </View>
    </ScrollView>
  );
};

export default SignUpScreen;

const baseMargin = 5;
const doubleBaseMargin = 10;
const blue = '#4287f5';

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  contentContainer: {
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  headerContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '90%',
    alignSelf: 'center',
    padding: 7,
  },
  headerText: {
    fontSize: 60,
    fontFamily: 'System',
    fontWeight: '700',
    color: Colors.dark,
    width: '70%',
  },
  formContainerStyle: {
    marginTop: 15,
    paddingHorizontal: doubleBaseMargin,
  },
  textInputStyle: {
    height: 50,
    marginVertical: baseMargin,
    paddingHorizontal: baseMargin,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderColor: '#E3E3E3',
    width: '90%',
    alignSelf: 'center',
    fontSize: 17,
  },
  errorLabelContainerStyle: {
    flex: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    width: '90%',
  },
  errorTextStyle: {
    color: '#F16B2B',
    textAlign: 'center',
  },
  buttonsContainerStyle: {
    marginTop: 23,
    alignItems: 'center',
    height: 300,
  },
  signInValidButtonStyle: {
    flex: 0.3,
    borderRadius: 30,
    backgroundColor: '#2AE03E',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedTextStyle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  facebookButtonStyle: {
    flex: 0.3,
    borderRadius: 30,
    backgroundColor: '#3b5998',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOr: {marginTop: 10, marginBottom: 10},
  privacyPolicyText: {
    marginTop: 15,
    width: '85%',
    color: 'gray',
    textAlign: 'center',
  },
});
