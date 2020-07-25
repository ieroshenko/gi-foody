import 'react-native';
import React from 'react';

describe('convertAMPMto24(), Given a string representing time of a reminder in AM/PM format convert to 24h', () => {
  test('1:30 AM', () => {
    let inputTime = '1:30 AM';
    let [expectedHours, expectedMintes] = [1, 30];

    let [actualHours, actualMinutes] = convertAMPMto24(inputTime);

    // Assert
    expect(actualHours).toBe(expectedHours);
    expect(actualMinutes).toBe(expectedMintes);
  });

  test('12:00 PM', () => {
    let inputTime = '12:00 PM';
    let [expectedHours, expectedMintes] = [12, 0];

    let [actualHours, actualMinutes] = convertAMPMto24(inputTime);

    // Assert
    expect(actualHours).toBe(expectedHours);
    expect(actualMinutes).toBe(expectedMintes);
  });

  test('12:00 AM', () => {
    let inputTime = '12:00 AM';
    let [expectedHours, expectedMintes] = [0, 0];

    let [actualHours, actualMinutes] = convertAMPMto24(inputTime);

    // Assert
    expect(actualHours).toBe(expectedHours);
    expect(actualMinutes).toBe(expectedMintes);
  });
});

const convertAMPMto24 = (time) => {
  let [hours, minsAndAMPM] = time.split(':');
  let [minutes, AMPM] = minsAndAMPM.split(' ');

  hours = Number(hours);
  minutes = Number(minutes);

  if (AMPM == 'PM' && hours < 12) {
    hours = hours + 12;
  }
  if (AMPM == 'AM' && hours == 12) {
    hours = hours - 12;
  }

  return [hours, minutes];
};
