import React, {useEffect, useState} from 'react';
import createStackNavigator from '@react-navigation/stack/src/navigators/createStackNavigator';
import Modal from 'react-native-modal';
import FilterMeals from './FilterMeals';
import FilterSettings from './FilterSettings';
import {fetchMealData} from '../../../wrappers/firestore/FirebaseWrapper';
import UserContext from '../../../hooks/UserContext';
import {TouchableOpacity, View} from 'react-native';
import {Icon} from 'react-native-elements';

export const FilterHeaderRight = (props) => {
  return (
    <View style={{marginRight: 15}}>
      <TouchableOpacity onPress={props.openFilterSettings}>
        <Icon name="sort" size={25} />
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();

const FilterMealsController = (props) => {
  const userID = React.useContext(UserContext);
  const [isFSettingsOpen, setIsFSettingsOpen] = useState(true);
  const [andOrOption, setAndOrOption] = useState('and');
  const [settings, setSettings] = useState([]);
  const [isValidRequest, setIsValidRequest] = useState(false);

  // fetch data from Firestore to SQLite if necessary
  useEffect(() => {
    fetchMealData(userID);
  }, [userID]);

  // Initialize filter settings
  useEffect(() => {
    let initSettings = props.symptoms.map((reminder) => {
      return {sympName: reminder, operator: null, filterValue: 0};
    });

    setSettings(initSettings);
  }, [props.symptoms]);

  const changeAndOrOption = (option) => {
    setAndOrOption(option);
  };

  const applyFilterOptions = () => {
    let isValidRequest = false;
    // check to make sure at least one filtering option was selected
    settings.forEach((settings) => {
      if (settings.operator) {
        isValidRequest = true;
      }
    });

    setIsValidRequest(isValidRequest);
  };

  const updateOperator = (sympName, operator) => {
    let updatedSettings = settings.map((setting) => {
      if (setting.sympName === sympName) {
        setting.operator === operator
          ? (setting.operator = null)
          : (setting.operator = operator);
      }

      return setting;
    });

    setSettings(updatedSettings);
  };

  const updateValue = (sympName, value) => {
    let updatedSettings = settings.map((setting) => {
      if (setting.sympName === sympName) {
        setting.filterValue = value;
      }

      return setting;
    });

    setSettings(updatedSettings);
  };

  return (
    <>
      <Stack.Navigator screenOptions={{headerBackTitleVisible: false}}>
        <Stack.Screen
          name="filter-meals-list"
          options={{
            headerRight: () => (
              <FilterHeaderRight
                openFilterSettings={() => setIsFSettingsOpen(true)}
              />
            ),
            title: null,
          }}>
          {() => (
            <FilterMeals
              symptoms={props.symptoms}
              settings={settings}
              andOrOption={andOrOption}
              isValidRequest={isValidRequest}
              resetRequestStatus={() => setIsValidRequest(false)}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <Modal
        isVisible={isFSettingsOpen}
        style={{justifyContent: 'flex-start', margin: 0}}>
        <FilterSettings
          symptoms={props.symptoms}
          closeSelf={() => setIsFSettingsOpen(false)}
          settings={settings}
          updateSympOperator={updateOperator}
          updateSympValue={updateValue}
          apply={applyFilterOptions}
          andOrOption={andOrOption}
          changeAndOrOption={changeAndOrOption}
        />
      </Modal>
    </>
  );
};

export default FilterMealsController;
