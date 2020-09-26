import React, {useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {LoginManager, AccessToken} from 'react-native-fbsdk';
import auth, {firebase} from '@react-native-firebase/auth';
import Modal from 'react-native-modal';
import {sendEmailVerification} from '../../wrappers/firestore/UserFS';
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
  Platform,
} from 'react-native';
import appleAuth, {
  AppleAuthRequestOperation,
  AppleAuthRequestScope,
  AppleButton,
} from '@invertase/react-native-apple-authentication';

const SignUpAnonymousScreen = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValid, setValid] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const signUserInWithCred = async (providerCredential) => {
    // Sign-in the user with the credential
    let response = await firebase
      .auth()
      .signInWithCredential(providerCredential);
    if (response && response.user) {
      setModalVisible(false);
      props.closeModal();
    }
  };

  const tryLinkTheAccount = (userCredential, providerName) => {
    // User was anonymous => try upgrade
    firebase
      .auth()
      .currentUser.linkWithCredential(userCredential)
      .then((userCred) => {
        // Success
        if (providerName === 'email') {
          sendEmailVerification();
        }
        props.updateUserAnonStatus();
        props.closeModal();
      })
      .catch((error) => {
        if (error.code === 'auth/credential-already-in-use') {
          Alert.alert(
            'Opps... The account is already in-use',
            'Would you like to sign in to the account instead?\nNote, if you sign in, the data on your current anonymous account will be lost',
            [
              {
                text: 'Nope',
                onPress: () => {
                  setModalVisible(false);
                  return null;
                },
              },
              {
                text: 'Sign In',
                onPress: () => signUserInWithCred(userCredential),
              },
            ],
          );
        } else if (error.code === 'auth/email-already-in-use') {
          setModalVisible(false);
          setError(
            error.toString().split(']')[1] +
              ' Please, consider logging into that account instead.',
          );
        }
      });
  };

  const onAppleBtnPress = async () => {
    try {
      setModalVisible(true);
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

      tryLinkTheAccount(appleCredential, 'apple');
    } catch (e) {
      setError(e.message);
      setModalVisible(false);
    }
  };

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

      tryLinkTheAccount(facebookCredential, 'facebook');
    } catch (e) {
      setError(e.message);
      setModalVisible(false);
    }
  };

  const doSignUpUserEmailPassword = async (email, password) => {
    try {
      setModalVisible(true);
      let emailCredential = firebase.auth.EmailAuthProvider.credential(
        email,
        password,
      );
      tryLinkTheAccount(emailCredential, 'email');
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

    doSignUpUserEmailPassword(email, password);
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
          <Text style={styles.headerText}>Let's sign you up!</Text>
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
            error={isValid}
            autoCapitalize="none"
          />

          <TextInput
            label={'Password'}
            secureTextEntry={true}
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
        <View style={styles.buttonsContainerStyle}>
          <TouchableHighlight
            style={styles.signInValidButtonStyle}
            onPress={doSignUp}
            underlayColor={blue}>
            <Text style={styles.getStartedTextStyle}>Sign up</Text>
          </TouchableHighlight>
          <Text style={styles.textOr}>OR</Text>
          {Platform.OS === 'ios' && (
            <View style={styles.appleButtonContainer}>
              <AppleButton
                buttonType={AppleButton.Type.SIGN_UP}
                buttonStyle={AppleButton.Style.BLACK}
                style={styles.appleButton}
                onPress={onAppleBtnPress}
              />
            </View>
          )}
          <TouchableHighlight
            style={styles.facebookButtonStyle}
            onPress={facebookSignUp}
            underlayColor={blue}>
            <Text style={styles.getStartedTextStyle}>
              Sign up with Facebook
            </Text>
          </TouchableHighlight>
          {/*<Text style={styles.privacyPolicyText}>*/}
          {/*  By continuing, you agree to GI-Foody's Terms & Conditions and*/}
          {/*  Privacy Policy*/}
          {/*</Text>*/}
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

export default SignUpAnonymousScreen;

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
    height: 70,
    borderRadius: 30,
    backgroundColor: '#2AE03E',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedTextStyle: {
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
  appleButton: {
    height: 55,
    width: '100%',
  },
  appleButtonContainer: {
    height: 70,
    width: '90%',
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textOr: {marginTop: 10, marginBottom: 10},
  privacyPolicyText: {
    marginTop: 15,
    width: '85%',
    color: 'gray',
    textAlign: 'center',
  },
});
