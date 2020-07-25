import React, {useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import auth, {firebase} from '@react-native-firebase/auth';
import SignUpScreen, {initSymptoms} from './SignUp';
import Modal from 'react-native-modal';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export const IntroScreen = (props) => {
  const [modalVisible, setModalVisible] = useState(false);

  const logUserInAnonymously = async () => {
    try {
      setModalVisible(true);
      let response = await firebase.auth().signInAnonymously();

      if (response && response.user) {
        setModalVisible(false);
        initSymptoms(response.user.uid);
      }
    } catch (e) {
      setModalVisible(false);
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={style.body}>
        <View style={style.vertContainer}>
          <Image
            style={style.tinyLogo}
            source={{uri: 'https://reactnative.dev/img/tiny_logo.png'}}
          />
          <Text style={[style.introHeaderText, style.text]}>GI Foody</Text>
        </View>
        <View style={style.introSectionContainer}>
          <View>
            <Text style={[style.introTitleText, style.text]}>
              Find correlation between meals and symptoms
            </Text>
          </View>
          <View style={style.introSectionUnderTitle}>
            <Text style={[style.introTextUnderTitle, style.text]}>
              Take a pic of your meal. Record Symptoms. Discover patterns.
            </Text>
          </View>
          <View style={style.introSectionAuth}>
            <TouchableHighlight
              style={style.btnSignUp}
              onPress={() => {
                props.navigation.navigate('SignUpScreen');
              }}
              underlayColor="#346eeb">
              <Text style={[style.text, style.signUpText]}>Sign up</Text>
            </TouchableHighlight>
          </View>
          <View style={[style.vertContainer, style.introSignIn]}>
            <TouchableOpacity
              style={style.btnSignIn}
              onPress={() => props.navigation.navigate('Sign In')}>
              <Text style={[style.text, style.txtHaveAccount]}>
                Already have an account?
              </Text>
              <Text style={[style.text, style.txtSignIn]}>Login</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={style.btnSkip}
            onPress={logUserInAnonymously}>
            <Text style={[style.text, style.txtSkip]}>Skip for now</Text>
          </TouchableOpacity>
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
      </View>
    </SafeAreaView>
  );
};

export default IntroScreen;

const style = StyleSheet.create({
  body: {
    paddingTop: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 26,
    flex: 1,
  },
  introSectionContainer: {
    marginTop: 70,
    backgroundColor: Colors.white,
  },
  introSectionUnderTitle: {
    marginTop: 32,
  },
  introSectionAuth: {
    marginTop: 80,
  },
  introSignIn: {
    marginTop: 40,
    justifyContent: 'center',
  },
  tinyLogo: {
    width: 30,
    height: 30,
  },
  vertContainer: {
    flexDirection: 'row',
  },
  introHeaderText: {
    marginLeft: 10,
    marginTop: 3,
    fontSize: 20,
    fontWeight: '500',
  },
  introTitleText: {
    fontSize: 48,
    fontWeight: '600',
  },
  introTextUnderTitle: {
    fontSize: 20,
  },
  signUpText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  text: {
    fontFamily: 'System',
    color: Colors.dark,
  },
  btnSignUp: {
    backgroundColor: '#4287f5',
    padding: 13,
    alignItems: 'center',
    borderRadius: 15,
  },
  btnSignIn: {
    backgroundColor: Colors.white,
    paddingLeft: 7,
    paddingRight: 7,
    flexDirection: 'row',
  },
  btnSkip: {
    backgroundColor: Colors.white,
    paddingLeft: 7,
    paddingRight: 7,
    alignItems: 'center',
    marginTop: 30,
  },
  txtSignIn: {
    color: '#f5a142',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 5,
  },
  txtHaveAccount: {
    fontSize: 17,
  },
  txtSkip: {
    fontSize: 15,
    color: '#919191',
    textDecorationLine: 'underline',
  },
});
