import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import {Icon} from 'react-native-elements';
import React, {useState} from 'react';
import firebase from '@react-native-firebase/app';
import UserContext from '../../../hooks/UserContext';
import DetailedMealItem from './DetailedMealItem';
import SymptomEditable from './SymptomEditable';
import {deleteMealDB} from '../../../wrappers/firestore/FirebaseWrapper';

const MealDetails = (props) => {
  const userID = React.useContext(UserContext);
  const [mealItems, setMealItems] = useState(props.items);

  const deleteMealItem = (itemID, mealID) => {
    let updatedMealItems = mealItems.filter(
      (item, index, array) => item.itemID !== itemID,
    );
    setMealItems(updatedMealItems);
    if (updatedMealItems.length === 0) {
      // Delete the meal completely
      deleteMeal(mealID);
      // Close the modal
      props.close();
    }
  };

  const deleteMeal = async (mealID) => {
    try {
      // Delete from flatlist
      props.deleteMeal(mealID);
      // delete from DB
      await deleteMealDB(userID, mealID);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContentContainer}>
            <TouchableOpacity onPress={() => props.close()}>
              <Icon name="close" size={30} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerText}>{props.title}</Text>
            <TouchableOpacity>
              <Icon name="more-horiz" size={35} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={styles.mainContent}>
          <FlatList
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
            data={mealItems}
            renderItem={({item}) => (
              <DetailedMealItem item={item} deleteMealItem={deleteMealItem} />
            )}
            keyExtractor={(item, index) => item.itemID}
            horizontal={true}
            style={styles.mealItemList}
            showsHorizontalScrollIndicator={false}
          />
          <View style={styles.symptomHolder}>
            <View style={styles.sympNotesContainer}>
              <Text style={styles.textSubheader}>Symptom Notes</Text>
              <TextInput
                value={props.symptomNotes}
                style={styles.sympNotesInput}
                onChangeText={(text) => props.setNotes(text)}
                blurOnSubmit={true}
                onBlur={props.updateSymptomNotes}
                placeholder="Enter symptom notes"
              />
            </View>
            <Text style={styles.textSubheader}>Symptoms</Text>
            <View style={styles.symptoms}>
              <FlatList
                data={props.mealSymptoms}
                renderItem={({item}) => (
                  <SymptomEditable
                    symptom={item}
                    mealID={props.meal.id}
                    updateParentSymptom={props.updateParentSymptoms}
                  />
                )}
                keyExtractor={([sympID, symptomValue], index) => sympID}
                scrollEnabled={false}
                alwaysBounceVertical={false}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default MealDetails;

const styles = StyleSheet.create({
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
  mealItemList: {
    width: '100%',
  },
  symptomHolder: {
    marginTop: 25,
    width: '90%',
    alignSelf: 'center',
    flex: 1,
  },
  textSubheader: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
    alignSelf: 'flex-start',
  },
  symptoms: {
    shadowRadius: 3,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {width: 1, height: 1},
    backgroundColor: 'white',
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  sympNotesContainer: {
    marginTop: 25,
    marginBottom: 25,
  },
  sympNotesInput: {
    fontSize: 16,
    fontFamily: 'System',
    alignSelf: 'flex-start',
    marginTop: 10,
    borderBottomWidth: 0.5,
    width: '100%',
    borderColor: 'gray',
    paddingBottom: 10,
  },
});
