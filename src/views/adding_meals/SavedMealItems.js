import {
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import React, {useState} from 'react';
import {Icon} from 'react-native-elements';
import SavedItem from './SavedItem';

const SavedMealItems = (props) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Favorite Meals</Text>
        {props.savedMeals.length ? (
          <FlatList
            contentContainerStyle={{marginTop: 20}}
            data={props.savedMeals}
            renderItem={({item}) => (
              <SavedItem
                item={item}
                closeSelf={props.closeSelf}
                openPreview={props.openPreview}
              />
            )}
          />
        ) : (
          <View style={styles.emptyDataContainer}>
            <Text style={styles.emptyDataTitle}>
              Add your first favorite meal!
            </Text>
            <Text style={styles.emptyDataText}>
              You can do so after taking a food-pic!
            </Text>
          </View>
        )}
      </View>
      <View style={styles.btnContainer}>
        <TouchableOpacity
          onPress={props.closeSelf}
          style={{marginLeft: 'auto'}}>
          <Icon name="close" size={40} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SavedMealItems;

const styles = StyleSheet.create({
  container: {
    flex: 0.9,
    flexDirection: 'column',
    overflow: 'hidden',
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    backgroundColor: '#f2f2f2',
  },
  contentContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 20,
  },
  btnContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 12,
    width: '90%',
    display: 'flex',
  },
  emptyDataContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 50,
    marginTop: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDataTitle: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 15,
    marginBottom: 10,
  },
  emptyDataText: {
    fontFamily: 'System',
    fontSize: 15,
  },
});
