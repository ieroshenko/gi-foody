import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import React, {useState} from 'react';
import RNFetchBlob from 'rn-fetch-blob';
import {Icon} from 'react-native-elements';
import UserContext from '../../hooks/UserContext';
import {
  updateNotes,
  deleteFavMealItem,
} from '../../wrappers/firestore/FirebaseWrapper';
import NetInfoContext from '../../hooks/NetInfoContext';

const EditFavScreen = (props) => {
  const [noteHeight, setNoteHeight] = useState(0);
  const [note, setNote] = useState(props.item.notes);
  const userID = React.useContext(UserContext);
  const isNetOnline = React.useContext(NetInfoContext);

  const handleSave = () => {
    updateNotes(userID, props.item.id, note).then(() => props.onClose());
  };

  const handleDelete = () => {
    deleteFavMealItem(
      userID,
      props.item.id,
      props.item.picID,
      isNetOnline,
    ).then((isInUse) => {
      // if (!isInUse) {
      //   props.onClose();
      // }
    });
  };

  let imgTransformDeg = props.item.isAndroid ? '90deg' : '0deg';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContentContainer}>
            <TouchableOpacity onPress={props.onClose}>
              <Icon name="close" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.scrollViewContent}>
          <Image
            source={{
              uri: `file://${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${props.item.picID}`,
            }}
            style={[styles.image, {transform: [{rotate: imgTransformDeg}]}]}
          />
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Note</Text>
            <TextInput
              style={[styles.notes, {height: Math.max(35, noteHeight)}]}
              multiline={true}
              onChangeText={(text) => setNote(text)}
              onContentSizeChange={(event) => {
                setNoteHeight(event.nativeEvent.contentSize.height + 5);
              }}
              blurOnSubmit={true}
              placeholder="Add a note">
              {note}
            </TextInput>
          </View>
          <View style={styles.btnContainer}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.btn, {backgroundColor: '#7d8aff'}]}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.btn, styles.deleteBtn]}>
              <Text style={[styles.btnText, {color: '#ff7d7d'}]}>
                Delete from favorites
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default EditFavScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'white'},
  container: {flex: 1, backgroundColor: 'white'},
  header: {
    width: '100%',
    height: 50,
    borderBottomWidth: 0.5,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContentContainer: {
    width: '95%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContent: {flex: 1},
  headerText: {fontWeight: '600'},
  headerBtnPlaceholder: {
    width: 30,
  },
  image: {height: 200, width: 200, borderRadius: 10, backgroundColor: 'white'},
  scrollViewContent: {alignItems: 'center', marginTop: 20},
  noteContainer: {
    marginTop: 40,
    width: '90%',
  },
  notes: {
    marginTop: 5,
    fontFamily: 'System',
    width: '100%',
    fontSize: 17,
    borderBottomWidth: 0.5,
    borderColor: 'gray',
    alignItems: 'center',
  },
  noteLabel: {
    fontWeight: '700',
    fontSize: 17,
  },
  btn: {
    width: '100%',
    borderRadius: 15,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'gray',
    marginBottom: 10,
  },
  btnContainer: {width: '90%', marginTop: 80},
  btnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteBtn: {backgroundColor: 'white', borderWidth: 3, borderColor: '#ff7d7d'},
});
