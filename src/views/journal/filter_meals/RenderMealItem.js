import {Image, Text, View, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';

const RenderMealItem = (props) => {
  const [downloadedImg, setDownloadedImg] = useState(false);

  useEffect(() => {
    props.item.handleImgDownload().then(() => setDownloadedImg(true));
  }, [props.item]);

  let hasNotes = props.item.notes ? true : false;
  let cardColor = hasNotes ? '#ebedff' : 'white';
  let transformDeg = props.item.isAndroid ? '90deg' : '0deg';
  return (
    <View style={[styles.mealItemContainer, {backgroundColor: cardColor}]}>
      {downloadedImg ? (
        <Image
          source={{uri: props.item.picPath}}
          style={[
            styles.mealItemImage,
            {
              transform: [{rotate: transformDeg}],
            },
          ]}
        />
      ) : (
        <View style={styles.mealItemImage} />
      )}
      {hasNotes && <Text style={styles.mealItemNotes}>{props.item.notes}</Text>}
    </View>
  );
};

export default RenderMealItem;

const styles = StyleSheet.create({
  mealItemContainer: {
    padding: 10,
    width: 150,
    borderRadius: 10,
    margin: 10,
  },
  mealItemNotes: {
    alignSelf: 'center',
    fontFamily: 'System',
    fontSize: 16,
    width: '95%',
    textAlign: 'center',
    marginTop: 5,
    padding: 5,
  },
  mealItemImage: {
    height: 130,
    width: 130,
    alignSelf: 'center',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#e6e6e6',
  },
});
