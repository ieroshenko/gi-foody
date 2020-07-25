import React, {useState} from 'react';
import firebase from '@react-native-firebase/app';
import {
  Image,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {deleteMealItem} from '../../wrappers/FirebaseWrapper';
import {Icon} from 'react-native-elements';

const DetailedMealItem = (props) => {
  const [note, setNote] = useState(props.item.notes);
  const [noteHeight, setNoteHeight] = useState(0);

  const updateNotesInDatabase = async () => {
    await firebase
      .firestore()
      .collection('users')
      .doc(firebase.auth().currentUser.uid)
      .collection('meals')
      .doc(props.item.mealID)
      .collection('mealItems')
      .doc(props.item.itemID)
      .update({notes: note});
  };

  const handleDelete = () => {
    let theItemID = props.item.itemID;
    let mealID = props.item.mealID;
    let imgID = props.item.picID;
    let itemTime = props.item.timeStamp.toDate().getTime().toString();
    let wasAddedToFavorites = props.item.fromFavorites;
    // Delete from DB, cloudstorage and cache
    deleteMealItem(theItemID, mealID, imgID, itemTime, wasAddedToFavorites);
    // Delete from array of items
    props.deleteMealItem(theItemID, mealID);
  };

  return (
    <View style={styles.mealItem}>
      <View style={styles.container}>
        <Image source={{uri: props.item.picPath}} style={styles.image} />
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon
            name="delete"
            size={30}
            color="white"
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.notes, {height: Math.max(45, noteHeight)}]}
        multiline={true}
        onChangeText={(text) => setNote(text)}
        onContentSizeChange={(event) => {
          setNoteHeight(event.nativeEvent.contentSize.height + 5);
        }}
        blurOnSubmit={true}
        onBlur={() => updateNotesInDatabase()}
        placeholder="Note">
        {note}
      </TextInput>
    </View>
  );
};

export default DetailedMealItem;

const styles = StyleSheet.create({
  mealItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 5,
  },
  container: {
    justifyContent: 'flex-end',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowColor: 'gray',
    shadowRadius: 7.49,
    shadowOpacity: 0.5,
    elevation: 20,
  },
  notes: {
    marginTop: 10,
    fontFamily: 'System',
    width: 190,
    fontSize: 17,
    borderBottomWidth: 0.5,
    borderColor: 'gray',
  },
  deleteBtn: {position: 'absolute', alignSelf: 'flex-start', padding: 10},
  deleteIcon: {
    shadowRadius: 5,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowOffset: {width: 1, height: 1},
  },
  image: {
    height: 200,
    width: 200,
    borderRadius: 10,
    backgroundColor: 'white',
  },
});
