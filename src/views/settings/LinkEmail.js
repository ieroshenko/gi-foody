import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {firebase} from '@react-native-firebase/auth';

const blue = '#4287f5';

const LinkEmail = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstPassword, setFirstPassword] = useState('');
  const [secondPassword, setSecondPassword] = useState('');
  const [error, setError] = useState('');
  const [valid, setValid] = useState(true);

  let isLinked = props.isLinked;

  const handleLinkEmail = async () => {
    if (!email) {
      setError('Email required *');
      setValid(false);
      return;
    } else if (
      !firstPassword &&
      firstPassword.trim() &&
      firstPassword.length > 6
    ) {
      setError('Weak password, minimum 5 chars');
      setValid(false);
      return;
    } else if (!isValidEmail(email)) {
      setError('Invalid Email');
      setValid(false);
      return;
    } else if (firstPassword !== secondPassword) {
      setError("Passwords don't match. Make sure you didn't make any error");
      setValid(false);
      return;
    } else {
      setError('');
      setValid(true);
    }

    setIsLoading(true);
    let emailCredential = firebase.auth.EmailAuthProvider.credential(
      email,
      firstPassword,
    );

    linkTheAccount(emailCredential);
  };

  const linkTheAccount = async (cred) => {
    await firebase
      .auth()
      .currentUser.linkWithCredential(cred)
      .then((userCred) => {
        // Success
        props.updateLinkedStatus(true);
      })
      .catch((e) => {
        setError(e.message);
        setValid(false);
      });

    setIsLoading(false);
  };

  /**
   * Check to make sure emails is valid
   * @return {boolean}
   */
  const isValidEmail = (email) => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleUnlinkEmail = async () => {
    if (props.canUnlink()) {
      setIsLoading(true);
      firebase
        .auth()
        .currentUser.unlink('password')
        .then(() => {
          Alert.alert('Done!', 'Email was unlinked successfully');
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

  return (
    <ScrollView
      style={{backgroundColor: 'white'}}
      contentContainerStyle={styles.body}>
      {isLinked ? (
        <>
          <Text style={styles.headerTxt}>Unlink Email from your account</Text>
          <TouchableOpacity
            onPress={handleUnlinkEmail}
            style={styles.facebookButtonStyle}>
            <Text style={styles.btnTxt}>Unlink</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.headerTxt}>
            Link Email address and password to your account to be able to sign
            in using these credentials
          </Text>
          <View style={styles.txtInputContainer}>
            <TextInput
              label={'Email'}
              keyboardType="email-address"
              style={styles.textInputStyle}
              placeholder="Email"
              onChangeText={(text) => {
                setError('');
                setEmail(text);
              }}
              autoCapitalize="none"
              error={valid}
            />
            <TextInput
              placeholder="Enter password"
              secureTextEntry={true}
              style={styles.textInputStyle}
              selectionColor={blue}
              autoCapitalize={'none'}
              onChangeText={(text) => {
                setError('');
                setFirstPassword(text);
              }}
              error={valid}
            />
            <TextInput
              placeholder="Repeat password"
              secureTextEntry={true}
              style={styles.textInputStyle}
              selectionColor={blue}
              autoCapitalize={'none'}
              onChangeText={(text) => {
                setError('');
                setSecondPassword(text);
              }}
              error={valid}
            />
          </View>
          <TouchableOpacity
            onPress={handleLinkEmail}
            style={styles.facebookButtonStyle}>
            <Text style={styles.btnTxt}>Link</Text>
          </TouchableOpacity>
          {error ? (
            <View style={styles.errorLabelContainerStyle}>
              <Text style={styles.errorTextStyle}>{error}</Text>
            </View>
          ) : null}
        </>
      )}
      <Modal isVisible={isLoading}>
        <ActivityIndicator size="large" />
      </Modal>
    </ScrollView>
  );
};

export default LinkEmail;

const styles = StyleSheet.create({
  body: {alignItems: 'center', paddingTop: 20},
  facebookButtonStyle: {
    marginTop: 20,
    borderRadius: 30,
    backgroundColor: '#7d8aff',
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
  textInputStyle: {
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderColor: '#E3E3E3',
    width: '90%',
    alignSelf: 'center',
    fontSize: 15,
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
  txtInputContainer: {
    marginTop: 30,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
});
