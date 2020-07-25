import 'react-native';
import React from 'react';
import {
  wasMealAddedToday,
  getTitleDate,
} from '../src/views/journal/TrackingJournal';

// Note: test renderer must be required after react-native.

describe('Tests for wasMealAddedToday()', () => {
  test('Given a Date object representing today, wasMealAddedToday() returns true', () => {
    let inputTodaysDate = new Date();
    let output = true;

    // Assert
    expect(wasMealAddedToday(inputTodaysDate)).toBe(output);
  });

  test('Given a Date object representing some other date (not today), return false', () => {
    let inputDate = new Date(2018, 11, 24, 10, 33, 30, 0);
    let output = false;

    // Assert
    expect(wasMealAddedToday(inputDate)).toBe(output);
  });
});

describe('Tests for getTitleData()', () => {
  test('Given a Date object representing today, return correct string output in format TODAY AT {}:{}', () => {
    let inputTodayStamp = new Date();
    let output = 'TODAY AT';
    // Assert
    expect(getTitleDate(inputTodayStamp).substr(0, 8)).toBe(output);
  });

  test('Given a Date object representing 27 Jun, return a correct string output in format 27 JUN AT ____ ', () => {
    let inputTodayStamp = new Date(2018, 5, 27, 10, 33, 30, 0);
    let output = '27 JUN AT';
    // Assert
    expect(getTitleDate(inputTodayStamp).substr(0, 9)).toBe(output);
  });
});
