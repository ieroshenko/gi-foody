import React, {useEffect, useReducer, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import UserContext from '../../../hooks/UserContext';
import FMeal from './FMeal';
import firebase from '@react-native-firebase/app';
import Database from '../../../wrappers/sqlite/SqliteFasade';
import {getMealItem} from '../../../wrappers/firestore/FirebaseWrapper';
import NetInfoContext from '../../../hooks/NetInfoContext';

const initialState = {
  documentData: [],
  lastVisIndex: null,
  isEmpty: true,
};

const scanReducer = (state, [type, meals, lastVisIndex]) => {
  switch (type) {
    case 'initial':
      return {
        ...state,
        documentData: meals,
        lastVisIndex: lastVisIndex,
        isEmpty: false,
      };
    case 'additional':
      return {
        ...state,
        documentData: [...state.documentData, ...meals],
        lastVisIndex: lastVisIndex,
      };
  }

  return state;
};

const renderMeal = ({item}) => {
  return <FMeal item={item} />;
};

const FilterMeals = (props) => {
  const userID = React.useContext(UserContext);
  let isNetOnline = React.useContext(NetInfoContext);
  const limit = 7;
  const [docState, dispatch] = useReducer(scanReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [allFilteredMeals, setAllFilteredMeals] = useState([]);
  const [canRetrieveMore, setCanRetrieveMore] = useState(false);

  // if correct filter options were applied, load data
  useEffect(() => {
    if (props.isValidRequest) {
      retrieveData().then(() => {
        setCanRetrieveMore(true);
        props.resetRequestStatus();
      });
    }
  }, [props.isValidRequest]);

  const handleObtainingMealItems = async (meals) => {
    const mealsWithItems = [...meals];

    // get corresponding meal items for each meal
    for (let i = 0; i < meals.length; i++) {
      let meal = meals[i];
      let querySnapshot = await firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .collection('meals')
        .doc(meal.id)
        .collection('mealItems')
        .get();

      // handle obtaining meal item image
      let mealItems = await Promise.all(
        querySnapshot.docs.map((queryDocSnapshot) =>
          getMealItem(
            queryDocSnapshot.data(),
            queryDocSnapshot.id,
            meal.id,
            isNetOnline,
            userID,
          ),
        ),
      );

      // add meal items to meal
      mealsWithItems[i] = {...meal, mealItems: mealItems};
    }

    return mealsWithItems;
  };

  const retrieveData = async () => {
    try {
      setLoading(true);

      let orSelected = props.andOrOption === 'or';

      let allFilteredMeals = await Database.getFilteredMeals(
        userID,
        props.settings,
        orSelected,
      );

      let mealsLength = allFilteredMeals.length;

      if (mealsLength) {
        setAllFilteredMeals(allFilteredMeals);

        let lastVisIndex = mealsLength > limit ? limit : mealsLength;
        let mealsData = allFilteredMeals.slice(0, lastVisIndex);

        let mealsWithItems = await handleObtainingMealItems(mealsData);

        dispatch(['initial', mealsWithItems, lastVisIndex]);
      }

      setLoading(false);
    } catch (e) {
      console.log('error occured in retrieve init data', e.message);
      setLoading(false);
    }
  };

  const retrieveMore = async () => {
    try {
      if (!docState.isEmpty && canRetrieveMore && !loading) {
        setLoading(true);

        let mealsLength = allFilteredMeals.length;

        // get last visible array index after retrieving more items
        let lastVisIndex =
          mealsLength > limit + docState.lastVisIndex
            ? limit + docState.lastVisIndex
            : mealsLength;

        let additionalMeals = allFilteredMeals.slice(
          docState.lastVisIndex,
          lastVisIndex,
        );

        if (additionalMeals.length) {
          // get corresponding meal items for each meal
          let mealsWithItems = await handleObtainingMealItems(additionalMeals);

          dispatch(['additional', mealsWithItems, lastVisIndex]);
        }

        setLoading(false);
      }
    } catch (e) {
      console.log('error in retrieve more');
      setLoading(false);
    }
  };

  /**
   * Return ActivityIndicator element in case if we're loading new meals
   * @return {null|*}
   */
  const renderFooter = () => {
    try {
      if (loading) {
        return <ActivityIndicator />;
      } else {
        return null;
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      {!docState.isEmpty ? (
        <>
          <FlatList
            data={docState.documentData}
            renderItem={renderMeal}
            // Item Key
            keyExtractor={(item, index) => item.id}
            // Footer (Activity Indicator)
            ListFooterComponent={renderFooter}
            // OnEndReached (function that is called when end is reached)
            onEndReached={retrieveMore}
            // How Close To The End Of List Until Next Data Request Is Made
            onEndReachedThreshold={0.5}
            style={styles.body}
            contentContainerStyle={styles.contentContainer}
            horizontal={false}
            removeClippedSubviews={false}
            windowSize={5}
            maxToRenderPerBatch={limit}
          />
        </>
      ) : (
        <View style={styles.emptyDataContainer}>
          {loading ? (
            <ActivityIndicator style={{alignSelf: 'center'}} size="large" />
          ) : (
            <>
              <Text style={styles.emptyDataTitle}>No data to be displayed</Text>
              <Text style={styles.emptyDataText}>
                If you haven't done so already, specify symptom-filtering
                options by tapping on the icon in upper right corner. Otherwise,
                no data was found with given filters
              </Text>
            </>
          )}
        </View>
      )}
    </>
  );
};

export default FilterMeals;

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    justifyContent: 'flex-start',
  },
  emptyDataContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 40,
    marginTop: 150,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  emptyDataTitle: {
    fontWeight: '700',
    fontFamily: 'System',
    fontSize: 18,
    marginBottom: 10,
    color: '#7d8aff',
    textAlign: 'center',
  },
  emptyDataText: {
    fontFamily: 'System',
    fontSize: 16,
    textAlign: 'center',
  },
});
