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
import {AccessToken, LoginManager} from 'react-native-fbsdk';

const LinkFacebook = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  let isLinked = props.isLinked;

  const handleUnlinkFbAccount = async () => {
    if (props.canUnlink()) {
      setIsLoading(true);
      firebase
        .auth()
        .currentUser.unlink('facebook.com')
        .then(() => {
          Alert.alert('Done!', 'Facebook account was unlinked successfully');
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

  const linkFbAccount = async (facebookCred) => {
    await firebase
      .auth()
      .currentUser.linkWithCredential(facebookCred)
      .then((userCred) => {
        // Success
        props.updateLinkedStatus(true);
      })
      .catch((e) => {
        Alert.alert('Something went wrong.', e.message);
      });

    setIsLoading(false);
  };

  const handleLinkFbAccount = async () => {
    try {
      setIsLoading(true);
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

      linkFbAccount(facebookCredential);
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
          <Text style={styles.headerTxt}>
            Unlink Facebook from your account
          </Text>
          <TouchableOpacity
            onPress={handleUnlinkFbAccount}
            style={styles.facebookButtonStyle}>
            <Text style={styles.btnTxt}>Unlink</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.headerTxt}>
            Link your account to Facebook to make sign in easier. We don't post
            anything to Facebook without your approval
          </Text>
          <TouchableOpacity
            onPress={handleLinkFbAccount}
            style={styles.facebookButtonStyle}>
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

export default LinkFacebook;

const styles = StyleSheet.create({
  body: {alignItems: 'center', paddingTop: 20},
  facebookButtonStyle: {
    marginTop: 20,
    borderRadius: 30,
    backgroundColor: '#3b5998',
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
