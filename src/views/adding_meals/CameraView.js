import React, {PureComponent, useState} from 'react';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {openSettings} from 'react-native-permissions';
import {SvgUri} from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {RNCamera} from 'react-native-camera';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import {ImagePreview} from './PicturePreview';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {createStackNavigator} from '@react-navigation/stack';

const PendingView = () => <View style={styles.pendingView} />;

const BlockedCameraView = () => (
  <View style={styles.pendingView}>
    <View style={styles.popUpSettings}>
      <Text style={styles.popUpTitle}>Oops!</Text>
      <Text style={styles.popUpMainText}>
        GI Foody is a Camera App. Please, allow camera access in Settings.
      </Text>
      <View>
        <TouchableOpacity
          style={styles.btnOpenSettings}
          onPress={() =>
            openSettings().catch(() => console.warn('cannot open settings'))
          }>
          <Text style={styles.btnText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const EnabledCameraView = (camera, takePicture) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'center',
    }}>
    <SvgUri
      style={styles.capture}
      width={75}
      height={75}
      uri={'https://svgur.com/i/M6s.svg'}
      onPress={() => takePicture(camera)}
    />
  </View>
);

const CameraView = (props) => {
  const [flashMode, setFlashMode] = useState('off');
  const insets = useSafeAreaInsets();

  /**
   * Change the flash mode selected by user. Off -> On -> Auto -> Off
   */
  const changeFlashMode = () => {
    let ans = 'off';
    if (flashMode === 'off') {
      ans = 'on';
    } else if (flashMode === 'on') {
      ans = 'auto';
    }

    setFlashMode(ans);
  };

  const takePicture = async (camera) => {
    const options = {
      quality: 0.4,
    };
    const data = await camera.takePictureAsync(options);
    props.openPreview(data.uri, '', false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <RNCamera
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode[flashMode]}
        captureAudio={false}>
        {({camera, status, recordAudioPermissionStatus}) => {
          if (status === 'PENDING_AUTHORIZATION') {
            return (
              <SafeAreaView edges={['right', 'top', 'left']} style={{flex: 0}}>
                {PendingView}
              </SafeAreaView>
            );
          } else if (status === 'NOT_AUTHORIZED') {
            return (
              <SafeAreaView edges={['right', 'top', 'left']} style={{flex: 0}}>
                {BlockedCameraView}
              </SafeAreaView>
            );
          }
          return (
            <SafeAreaView edges={['bottom', 'top', 'left']} style={{flex: 0}}>
              {EnabledCameraView(camera, takePicture)}
            </SafeAreaView>
          );
        }}
      </RNCamera>
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          flexDirection: 'row',
          marginTop: 20,
          width: '90%',
          display: 'flex',
        }}>
        <TouchableOpacity style={{width: 40}} />
        <TouchableOpacity
          onPress={() => changeFlashMode()}
          style={{marginLeft: 'auto'}}>
          <Icon
            name={'flash-' + flashMode} // use icon corresponding to user selection
            size={40}
            color="white"
            style={{
              shadowRadius: 5,
              shadowColor: 'black',
              shadowOpacity: 0.5,
              shadowOffset: {width: 1, height: 1},
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={props.closeModal}
          style={{marginLeft: 'auto'}}>
          <Icon
            name="close"
            size={40}
            color="white"
            style={{
              shadowRadius: 5,
              shadowColor: 'black',
              shadowOpacity: 0.5,
              shadowOffset: {width: 1, height: 1},
            }}
          />
        </TouchableOpacity>
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          width: '90%',
          flexDirection: 'row',
          bottom: insets.bottom,
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: 35,
        }}>
        <TouchableOpacity onPress={props.openSavedModal}>
          <Icon name="library-add" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraView;

const styles = StyleSheet.create({
  container: {
    flex: 0.75,
    flexDirection: 'column',
    overflow: 'hidden',
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'yellow',
  },
  capture: {
    marginBottom: 20,
  },
  pendingView: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popUpSettings: {
    flex: 0,
    flexDirection: 'column',
    borderRadius: 15,
    backgroundColor: '#fff',
    padding: 20,
    width: '75%',
    height: 210,
  },
  popUpTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 23,
  },
  popUpMainText: {
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 30,
  },
  btnText: {
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: '400',
    color: Colors.white,
    fontSize: 17,
  },
  btnOpenSettings: {
    alignSelf: 'center',
    backgroundColor: '#f5a142',
    padding: 14,
    justifyContent: 'center',
    width: 180,
    borderRadius: 30,
  },
});
