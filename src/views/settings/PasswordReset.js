import React, {useState} from 'react';
import firebase from '@react-native-firebase/app';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PasswordReset = (props) => {
  const [error, setError] = useState('');
  const email = props.email;

  const handlePasswordReset = () => {
    let auth = firebase.auth();

    auth
      .sendPasswordResetEmail(email)
      .then(() =>
        Alert.alert(
          'Reset link has been sent',
          `Check your email ${email} for Reset Password Link to change your password`,
        ),
      )
      .catch((e) => {
        setError(e.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTxt}>
        You can change your current account password by clicking the link below
        and following the instructions
      </Text>
      <TouchableOpacity onPress={handlePasswordReset} style={styles.saveBtn}>
        <Text style={styles.btnTxt}>Reset Password</Text>
      </TouchableOpacity>
      {error ? (
        <View style={styles.errorLabelContainerStyle}>
          <Text style={styles.errorTextStyle}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default PasswordReset;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
  },
  headerTxt: {
    fontFamily: 'System',
    fontSize: 16,
    width: '95%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  saveBtn: {
    width: '90%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#7d8aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  btnTxt: {
    fontSize: 17,
    fontFamily: 'System',
    color: 'white',
    fontWeight: '600',
  },
  errorLabelContainerStyle: {
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
});
