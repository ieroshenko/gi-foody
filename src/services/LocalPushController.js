import PushNotification from 'react-native-push-notification';
import {Alert, Platform} from 'react-native';
import {
  updateScheduledStatus,
  deactivateAllActiveRems,
} from '../wrappers/firestore/RemindersDBManagement';
import Database from '../wrappers/sqlite/SqliteFasade';

PushNotification.configure({
  // (required) Called when a remote or local notification is opened or received
  onNotification: function (notification) {
    let fieldDataFieldName = Platform.OS === 'ios' ? 'data' : 'userInfo';
    if (notification[fieldDataFieldName].type === 'after') {
      unscheduleReminder(notification[fieldDataFieldName].id);
    }
  },
  popInitialNotification: true,
  requestPermissions: false,
});

export const scheduleAfterMealReminders = async (userID, reminders) => {
  let remindersForScheduling = reminders.filter(
    (reminder) => reminder.type === 'after' && reminder.isActive,
  );

  remindersForScheduling.forEach((reminder) => {
    let [hours, minutes] = reminder.time.split(':');

    // Convert time of the reminder into milliseconds
    let timeConverted = Number(hours) * 3600000 + Number(minutes) * 60000;

    PushNotification.localNotificationSchedule({
      id: reminder.id,
      autoCancel: true,
      title: reminder.message,
      message: ' ',
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      date: new Date(Date.now() + timeConverted),
      userInfo: {type: reminder.type, id: reminder.id, msg: reminder.message},
    });

    updateScheduledStatus(reminder.id, true);
  });
};

export const scheduleFixedReminders = async (userID, reminders) => {
  let remindersForScheduling = [];

  for (let i = 0; i < reminders.length; i++) {
    let reminder = reminders[i];
    let sqlRem = await Database.getReminderById(reminder.id);

    if (reminder.type === 'fixed' && reminder.isActive && !sqlRem.isScheduled) {
      remindersForScheduling.push(reminder);
    }
  }

  remindersForScheduling.forEach((reminder) => {
    let [hours, minutes] = convertAMPMto24(reminder.time);

    //make sure the time is going to be in the future always
    let reminderDate = getFixedReminderDate(hours, minutes, new Date());

    PushNotification.localNotificationSchedule({
      id: reminder.id,
      autoCancel: true,
      title: reminder.message,
      message: ' ',
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      date: reminderDate,
      userInfo: {type: reminder.type, id: reminder.id, msg: reminder.message},
      repeatType: 'day',
    });

    updateScheduledStatus(reminder.id, true);
  });
};

export const getFixedReminderDate = (rHour, rMin, currentDate) => {
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

export const convertAMPMto24 = (time) => {
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

export const cancelNecessaryReminders = (userID, reminders) => {
  reminders.forEach((reminder) => {
    Database.getReminderById(reminder.id).then((sqlReminder) => {
      if (!reminder.isActive && sqlReminder.isScheduled) {
        unscheduleReminder(reminder.id);
      }
    });
  });

  syncOfflineOnlineReminders(reminders);
};

const syncOfflineOnlineReminders = async (reminders) => {
  let sqlRems = await Database.listReminders();
  let sqlRemsById = sqlRems.map((sqlRem) => sqlRem.reminderId);

  let remsById = reminders.map((rem) => rem.id);

  sqlRemsById.forEach((sqlRemId) => {
    if (!remsById.includes(sqlRemId)) {
      Database.deleteReminder(sqlRemId);
    }
  });
};

export const unscheduleReminder = (reminderID) => {
  PushNotification.cancelLocalNotifications({id: reminderID});
  updateScheduledStatus(reminderID, false);
};

export const deactivateAllReminders = (userID) => {
  PushNotification.cancelAllLocalNotifications();
  deactivateAllActiveRems(userID);
};
