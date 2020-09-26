import React, {useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {LoginManager, AccessToken} from 'react-native-fbsdk';
import auth, {firebase} from '@react-native-firebase/auth';
import Modal from 'react-native-modal';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {deleteUser} from '../../wrappers/firestore/FirebaseWrapper';
import appleAuth, {
  AppleAuthRequestOperation,
  AppleAuthRequestScope,
  AppleButton,
} from '@invertase/react-native-apple-authentication';
import {createNewDBUser} from '../../wrappers/firestore/UserFS';

const SignInScreen = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValid, setValid] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const onAppleBtnPress = async () => {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [
          AppleAuthRequestScope.EMAIL,
          AppleAuthRequestScope.FULL_NAME,
        ],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw 'Apple Sign-In failed - no identify token returned';
      }

      // Create a Firebase credential from the response
      const {identityToken, nonce} = appleAuthRequestResponse;
      const appleCredential = firebase.auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      // Sign-in the user with the credential
      let response = await firebase
        .auth()
        .signInWithCredential(appleCredential);
      if (response && response.user) {
        await createNewDBUser(response.user);
        setModalVisible(false);
      }
    } catch (e) {
      setError(e.message);
      setModalVisible(false);
    }
  };

  const facebookLogIn = async () => {
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
      }
    } catch (e) {
      setError(e.message);
      setModalVisible(false);
    }
  };

  const doLoginUser = async (email, password) => {
    try {
      setModalVisible(true);
      let response = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);
      if (response && response.user) {
        // previously signed in anonymously and just signed in
        if (props.anonUserId) {
          deleteUser(props.anonUserId);
        }
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

  const doSignIn = () => {
    if (!email) {
      setError('Email required *');
      setValid(false);
      return;
    } else if (!isValidEmail(email)) {
      setError('Invalid Email');
      setValid(false);
      return;
    } else if (password.length == 0) {
      setError('Please, enter your password');
      setValid(false);
      return;
    } else {
      setError('');
      setValid(true);
    }

    doLoginUser(email, password);
  };

  /**
   * Check to make sure emails is valid
   * @return {boolean}
   */
  const isValidEmail = (email) => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handlePasswordReset = () => {
    // check if email is valid
    if (!email) {
      setError('Email required *');
      setValid(false);
      return;
    } else if (!isValidEmail(email)) {
      setError('Invalid Email');
      setValid(false);
      return;
    } else {
      setError;
      setValid(true);

      let auth = firebase.auth();

      auth
        .sendPasswordResetEmail(email)
        .then(() =>
          Alert.alert(
            'Reset link has been sent',
            'Check your email for Reset Password Link to reset your password',
          ),
        )
        .catch((e) => {
          setError(e.message);
          setValid(false);
        });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome back</Text>
        </View>
        <View style={styles.formContainerStyle}>
          <TextInput
            label={'Email'}
            keyboardType="email-address"
            style={styles.textInputStyle}
            placeholder="Mail address"
            onChangeText={(text) => {
              setError('');
              setEmail(text);
            }}
            error={isValid}
            autoCapitalize="none"
          />

          <TextInput
            label={'Password'}
            secureTextEntry
            style={styles.textInputStyle}
            selectionColor={blue}
            placeholder="Password"
            error={isValid}
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
          />
        </View>
        {error ? (
          <View style={styles.errorLabelContainerStyle}>
            <Text style={styles.errorTextStyle}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={handlePasswordReset}
          style={styles.resetPasswordBtn}>
          <Text style={styles.resetPasswordTxt}>Forgot password?</Text>
        </TouchableOpacity>
        <View style={styles.buttonsContainerStyle}>
          <TouchableHighlight
            style={styles.signInValidButtonStyle}
            onPress={doSignIn}
            underlayColor={blue}>
            <Text style={styles.loginTextStyle}>Log in</Text>
          </TouchableHighlight>
          <Text style={styles.textOr}>OR</Text>
          {Platform.OS === 'ios' && (
            <View style={styles.appleButtonContainer}>
              <AppleButton
                buttonType={AppleButton.Type.SIGN_IN}
                buttonStyle={AppleButton.Style.BLACK}
                style={styles.appleButton}
                onPress={onAppleBtnPress}
              />
            </View>
          )}
          <TouchableHighlight
            style={styles.facebookButtonStyle}
            onPress={facebookLogIn}
            underlayColor={blue}>
            <Text style={styles.loginTextStyle}>Log in with Facebook</Text>
          </TouchableHighlight>
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

export default SignInScreen;

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
    fontSize: 50,
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
    height: 70,
    borderRadius: 30,
    backgroundColor: '#FFB62E',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTextStyle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  facebookButtonStyle: {
    height: 70,
    borderRadius: 30,
    backgroundColor: '#3b5998',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonContainer: {
    height: 70,
    width: '90%',
    overflow: 'hidden',
    borderRadius: 30,
    marginBottom: 10,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButton: {
    height: 55,
    width: '100%',
  },
  textOr: {marginTop: 10, marginBottom: 10},
  privacyPolicyText: {
    marginTop: 15,
    width: '85%',
    color: 'gray',
    textAlign: 'center',
  },
  resetPasswordBtn: {alignSelf: 'center', marginTop: 10},
  resetPasswordTxt: {color: '#7d8aff'},
});
