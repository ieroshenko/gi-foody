import React, {useEffect, useState} from 'react';
import {FlatList, Image, Text, View, StyleSheet} from 'react-native';
import RenderMealItem from './RenderMealItem';
import {getTitleDate, renderSymptom} from '../GlobalMealFunctions';
import renderMealItem from './RenderMealItem';

const FMeal = React.memo(
  (props) => {
    const mealItems = props.item.mealItems;
    const mealStarted = props.item.mealStarted;
    const symptomNotes = props.item.symptomNotes;
    const mealSymptoms = props.item.mealSymptoms
      ? Object.entries(props.item.mealSymptoms)
      : [];

    let title = getTitleDate(new Date(mealStarted));
    return (
      <View style={styles.mealCard}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <FlatList
          data={mealItems}
          // Item Key
          keyExtractor={(item, index) => item.id}
          horizontal={true}
          renderItem={({item}) => <RenderMealItem item={item} />}
          style={styles.mealItemContainer}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
        />
        {symptomNotes ? (
          <View style={styles.sympNotesContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: 'black',
                  marginBottom: 5,
                  width: '98%',
                  alignSelf: 'center',
                  textAlign: 'left',
                },
              ]}>
              Symptom Note
            </Text>
            <Text style={styles.sympNotes}>{symptomNotes}</Text>
          </View>
        ) : null}
        <View style={styles.sympContainer}>
          <FlatList
            data={mealSymptoms}
            keyExtractor={([id, val], index) => id}
            renderItem={renderSymptom}
            style={{minHeight: 35}}
          />
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.item.mealItems.length === nextProps.item.mealItems.length;
  },
);

export default FMeal;

const styles = StyleSheet.create({
  sympContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '95%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    width: '95%',
    marginTop: 12.5,
    marginBottom: 12.5,
    borderRadius: 15,
    alignSelf: 'center',
  },
  titleWrapper: {
    margin: 20,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#7d8aff',
  },
  mealItemContainer: {
    alignSelf: 'center',
    width: '95%',
    marginBottom: 15,
  },
  btnContainer: {
    width: '100%',
    paddingBottom: 20,
    justifyContent: 'center',
    marginTop: 5,
  },
  openDetailsBtn: {
    backgroundColor: '#ebedff',
    width: '50%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  openDetailsTxt: {
    color: '#7d8aff',
    fontFamily: 'System',
    fontWeight: '700',
  },
  sympNotes: {
    fontSize: 17,
    fontFamily: 'System',
    width: '98%',
    textAlign: 'left',
    alignSelf: 'center',
  },
  sympNotesContainer: {
    alignSelf: 'center',
    width: '95%',
    paddingBottom: 10,
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderColor: '#dedede',
  },
});
