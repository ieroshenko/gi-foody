import React, {useState} from 'react';
import {Image, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import {Icon} from 'react-native-elements';
import Modal from 'react-native-modal';
import EditFavScreen from './EditFavoriteItem';

const SavedItem = (props) => {
  const [isEditVis, setIsEditVis] = useState(false);

  const openEditScreen = () => {
    setIsEditVis(true);
  };

  const closeEditScreen = () => {
    setIsEditVis(false);
  };

  let imgTransformDeg = props.item.isAndroid ? '90deg' : '0deg';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          props.openPreview(
            props.item.picID,
            props.item.notes,
            true,
            props.item.isAndroid,
          );
        }} //TODO: open preview and close itself
        style={styles.itemBtn}>
        <Image
          source={{
            uri: `file://${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${props.item.picID}`,
          }}
          style={[styles.img, {transform: [{rotate: imgTransformDeg}]}]}
        />
        <Text style={styles.notes}>{props.item.notes}</Text>
        <TouchableOpacity onPress={openEditScreen}>
          <Icon
            name="create"
            size={24}
            color="#7d8aff"
            style={styles.editIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
      <Modal isVisible={isEditVis} style={styles.defaultModal}>
        <EditFavScreen onClose={closeEditScreen} item={props.item} />
      </Modal>
    </View>
  );
};

export default SavedItem;

const styles = StyleSheet.create({
  container: {width: '100%', alignItems: 'center', marginBottom: 10},
  itemBtn: {
    width: '95%',
    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  img: {width: 80, height: 80, borderRadius: 10},
  notes: {width: '55%', fontFamily: 'System', fontSize: 16},
  editIcon: {borderRadius: 50, backgroundColor: '#ebedff', padding: 10},
  defaultModal: {justifyContent: 'flex-end', margin: 0},
});
