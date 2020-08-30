import React, {useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import {firebase} from '@react-native-firebase/auth';
import RNFetchBlob from 'rn-fetch-blob';

const SettingsHome = (props) => {
  const isAnonymous = props.isAnonymous;
  const [imageCacheSize, setImageCacheSize] = useState(0);

  const getImgCacheSize = () => {
    RNFetchBlob.fs
      .stat(`${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`)
      .then((stats) => {
        setImageCacheSize(stats.size);
      })
      .catch((err) => {});
  };

  useEffect(() => {
    getImgCacheSize();
  }, []);

  const clearImageCache = async () => {
    // delete imgCache dir, then create again
    RNFetchBlob.fs
      .unlink(`${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`)
      .then(() => {
        RNFetchBlob.fs
          .mkdir(`${RNFetchBlob.fs.dirs.CacheDir}/ImgCache`)
          .then(() => getImgCacheSize());
      });
  };

  const signUserOut = () => {
    isAnonymous
      ? Alert.alert(
          'Cannot do this',
          'You are currently signed in anonymously. Please, sign up or sign in',
        )
      : firebase
          .auth()
          .signOut()
          .then(() => console.log('Signed out'));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      style={{backgroundColor: 'white'}}
      scrollEnabled={true}
      alwaysBounceVertical={true}>
      {/*<View style={styles.sectionContainer}>*/}
      {/*  <TouchableOpacity style={styles.menuBtn}>*/}
      {/*    <Text style={styles.menuTxt}>Rate us</Text>*/}
      {/*    <Text>{'❤️'}</Text>*/}
      {/*  </TouchableOpacity>*/}
      {/*</View>*/}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() =>
            props.navigationProps.navigation.navigate('combine-meals')
          }>
          <Text style={styles.menuTxt}>Combine meals</Text>
          <Text style={styles.valueStyle}>{`${props.combineMeals} min`}</Text>
        </TouchableOpacity>
      </View>

      {!isAnonymous && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              props.navigationProps.navigation.navigate('link-multiple')
            }>
            <Text style={styles.menuTxt}>Link multiple providers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              props.navigationProps.navigation.navigate('reset-password')
            }>
            <Text style={styles.menuTxt}>Reset password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={signUserOut}>
            <Text style={styles.menuTxt}>Log out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Others</Text>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() =>
            Linking.openURL(
              'https://docs.google.com/document/d/1KghniG_oiGqxjhvULtZDbjmwTsKaz-NqQR0MwCr1AM4/edit?usp=sharing',
            )
          }>
          <Text style={styles.menuTxt}>Terms and Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={clearImageCache}>
          <Text style={styles.menuTxt}>
            Image Cache: {Math.round((imageCacheSize / 1000000) * 10) / 10} MB
          </Text>
          <Text style={[styles.menuTxt, {color: '#7d8aff'}]}>Clear</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsHome;

const styles = StyleSheet.create({
  body: {alignItems: 'center', backgroundColor: 'white'},
  sectionContainer: {width: '92%', marginTop: 30},
  menuBtn: {
    paddingTop: 17,
    paddingBottom: 17,
    borderBottomWidth: 0.5,
    borderColor: '#d1d1d1',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  menuTxt: {
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'System',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 20,
    fontFamily: 'System',
    marginBottom: 10,
  },
  valueStyle: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#bababa',
  },
});
