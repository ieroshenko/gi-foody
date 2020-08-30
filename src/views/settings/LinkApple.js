import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import {AccessToken, LoginManager} from 'react-native-fbsdk';
import {sendEmailVerification} from '../authentication/SignUp';
import appleAuth, {
  AppleAuthRequestOperation,
  AppleAuthRequestScope,
} from '@invertase/react-native-apple-authentication';

const LinkApple = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  let isLinked = props.isLinked;

  const handleUnlinkAppleAccount = async () => {
    if (props.canUnlink()) {
      setIsLoading(true);
      firebase
        .auth()
        .currentUser.unlink('apple.com')
        .then(() => {
          Alert.alert('Done!', 'Apple account was unlinked successfully');
          props.updateLinkedStatus(false);
        })
        .catch((e) => Alert.alert('Something went wrong', e.message));

      setIsLoading(false);
    } else {
      Alert.alert(
        'Something isn not right',
        'You need to have at least one provider connected to your account',
      );
    }
  };

  const linkAppleAccount = async (appleCred) => {
    await firebase
      .auth()
      .currentUser.linkWithCredential(appleCred)
      .then((userCred) => {
        // Success
        props.updateLinkedStatus(true);
      })
      .catch((e) => {
        Alert.alert('Something went wrong.', e.message);
      });

    setIsLoading(false);
  };

  const handleLinkAppleAccount = async () => {
    try {
      setIsLoading(true);
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

      linkAppleAccount(appleCredential);
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{backgroundColor: 'white'}}
      contentContainerStyle={styles.body}>
      {isLinked ? (
        <>
          <Text style={styles.headerTxt}>Unlink Apple from your account</Text>
          <TouchableOpacity
            onPress={handleUnlinkAppleAccount}
            style={styles.appleBtnStyle}>
            <Text style={styles.btnTxt}>Unlink</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.headerTxt}>
            Link your account to Apple to make sign in easier
          </Text>
          <TouchableOpacity
            onPress={handleLinkAppleAccount}
            style={styles.appleBtnStyle}>
            <Text style={styles.btnTxt}>Link</Text>
          </TouchableOpacity>
        </>
      )}
      <Modal isVisible={isLoading}>
        <ActivityIndicator size="large" />
      </Modal>
    </ScrollView>
  );
};

export default LinkApple;

const styles = StyleSheet.create({
  body: {alignItems: 'center', paddingTop: 20},
  appleBtnStyle: {
    marginTop: 20,
    borderRadius: 30,
    backgroundColor: 'black',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  btnTxt: {color: 'white', fontSize: 15, fontWeight: '700'},
  headerTxt: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    width: '90%',
  },
});
