import 'react-native';
import React from 'react';

describe(
  'getFixedReminderDate, Given suggested date of reminder, ' +
    'convert it to correct date in the future (to avoid weird android behaviour)',
  () => {
    test('Given date + time in the past => return date in the future with the same time', () => {
      let inputHour = 13;
      let inputMin = 30;

      let inputCurrentDate = new Date(2020, 6, 22, 14); //input is 30 minutes late

      let expectedDate = new Date(2020, 6, 23, 13, 30);

      let actualDate = getFixedReminderDate(
        inputHour,
        inputMin,
        inputCurrentDate,
      );

      // Assert
      expect(actualDate).toStrictEqual(expectedDate);
    });

    test('Given date + time in the past => return date in the future with the same time (diff month)', () => {
      let inputHour = 14;
      let inputMin = 0;

      let inputCurrentDate = new Date(2020, 6, 31, 15); //input is 30 minutes late

      let expectedDate = new Date(2020, 7, 1, 14);

      let actualDate = getFixedReminderDate(
        inputHour,
        inputMin,
        inputCurrentDate,
      );

      // Assert
      expect(actualDate).toStrictEqual(expectedDate);
    });
  },
);

const getFixedReminderDate = (rHour, rMin, currentDate) => {
  let tYear = currentDate.getFullYear();
  let tMonth = currentDate.getMonth();
  let tDay = currentDate.getDate();

  let reminderDate = new Date(tYear, tMonth, tDay, rHour, rMin);

  let reminderMSeconds = reminderDate.getTime();
  let currentDateMSeconds = currentDate.getTime();

  if (reminderMSeconds < currentDateMSeconds) {
    // increase day (schedule for next day)
    let nextDayMSeconds = reminderMSeconds + 86400000;
    reminderDate = new Date(nextDayMSeconds);
  }

  return reminderDate;
};
