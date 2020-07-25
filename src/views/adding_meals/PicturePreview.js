import RNFetchBlob from 'rn-fetch-blob';
import * as RootNavigation from '../../hooks/RootNavigation';
import * as JournalList from '../../hooks/JournalList';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {addToFavorites, addNewMealItem} from '../../wrappers/FirebaseWrapper';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import {Icon} from 'react-native-elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import UserContext from '../../hooks/UserContext';
import NetInfoContext from '../../hooks/NetInfoContext';
import * as NotificationsController from '../../services/LocalPushController';
import AwesomeAlert from 'react-native-awesome-alerts';

export const ImagePreview = (props) => {
  const userID = React.useContext(UserContext);
  const isNetOnline = React.useContext(NetInfoContext);
  const [notes, setNotes] = useState(props.notes);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const fromFavorites = props.fromFavorites;

  let imgID;

  if (fromFavorites) {
    // get id right away
    imgID = props.imgUri;
  } else {
    // pic was just added
    let imgSplitArray = props.imgUri.split('/');
    // get the image id
    imgID = imgSplitArray[imgSplitArray.length - 1];
  }

  // check if device is android
  let isAndroid = Platform.OS === 'android' ? true : false;

  const moveImgToCache = async () => {
    let newDir = `${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`;

    try {
      await RNFetchBlob.fs.mv(
        `${RNFetchBlob.fs.dirs.CacheDir}/Camera/${imgID}`,
        newDir,
      );
    } catch (e) {
      console.log(e);
    }

    return newDir;
  };

  const onAddToFavorites = async () => {
    let newDir = await moveImgToCache();
    addToFavorites(
      userID,
      imgID,
      isAndroid,
      notes,
      isNetOnline,
      newDir,
      fromFavorites || isFavorited,
    );
    setIsFavorited(true);
    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
    }, 300);
  };

  const onConfirm = async () => {
    // move the pic from cache/camera dir to cache dir (NOT THE BEST SOLUTION)

    let newDir = await moveImgToCache();

    addNewMealItem(
      imgID,
      newDir,
      isAndroid,
      notes,
      userID,
      isNetOnline,
      props.reminders,
      isFavorited || fromFavorites,
    );

    // Navigate to Eating Journal and scroll to top
    RootNavigation.navigate('Journal');
    JournalList.scrollToTop();
    props.onCloseClick();
  };

  const insets = useSafeAreaInsets();

  let imgTransformDeg = isAndroid ? '90deg' : '0deg';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FOOD DETAILS</Text>
      <KeyboardAvoidingView
        style={styles.keyBoardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'none'}
        keyboardVerticalOffset={130}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.mainContentContainer}>
            <Image
              source={{
                uri: fromFavorites
                  ? `file://${RNFetchBlob.fs.dirs.CacheDir}/${imgID}`
                  : props.imgUri,
              }}
              style={[
                styles.mealItemImage,
                {transform: [{rotate: imgTransformDeg}]},
              ]}
            />
            <TextInput
              label={'Notes'}
              placeholder="Add a note or a comment"
              style={styles.notesInputStyle}
              onChangeText={(text) => {
                setNotes(text);
              }}
              autoCapitalize="none"
              value={notes}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.closeIconContainer}>
        <TouchableOpacity
          onPress={() => {
            // remove the image locally
            RNFetchBlob.fs.unlink(
              `${RNFetchBlob.fs.dirs.CacheDir}/Camera/${imgID}`,
            );
            props.onCloseClick();
          }}>
          <Icon name="close" size={30} color="gray" />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.submitContainer,
          {paddingBottom: insets.bottom === 0 ? 15 : insets.bottom},
        ]}>
        <TouchableOpacity
          style={styles.submitButtonStyle}
          onPress={() => {
            onConfirm();
          }}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButtonStyle,
            {marginTop: 10, backgroundColor: '#ebedff'},
          ]}
          onPress={onAddToFavorites}>
          <Text style={[styles.buttonText, {color: '#7d8aff'}]}>
            Add to favorites
          </Text>
        </TouchableOpacity>
      </View>
      <AwesomeAlert
        show={showConfirm}
        showProgress={false}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        alertContainerStyle={{backgroundColor: 'rgba(52, 52, 52, alpha)'}}
        onDismiss={() => setShowConfirm(false)}
        customView={<Icon name="check" size={35} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {flex: 1, width: '100%', backgroundColor: 'white'},
  container: {
    flex: 0.85,
    backgroundColor: 'white',
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    alignItems: 'center',
    paddingTop: 30,
    width: '100%',
  },
  mainContentContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'flex-end',
    marginTop: 15,
    width: '95%',
  },
  title: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 28,
    color: '#131a5c', //#7d8aff
  },
  mealItemImage: {
    alignSelf: 'center',
    marginTop: 30,
    height: 200, //TODO: update dynamically
    width: 200,
    backgroundColor: '#e6e6e6',
    borderRadius: 20,
  },
  notesInputStyle: {
    backgroundColor: '#d4d9ff',
    borderRadius: 10,
    width: '100%',
    fontFamily: 'System',
    fontSize: 16,
    padding: 15,
    marginTop: 60,
  },
  submitButtonStyle: {
    width: '100%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7d8aff',
    borderRadius: 10,
  },
  buttonText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  submitContainer: {
    backgroundColor: 'white',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    padding: 15,
    borderTopWidth: 0.5,
    borderColor: '#e6e6e6',
  },
  keyBoardAvoiding: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
  },
});
