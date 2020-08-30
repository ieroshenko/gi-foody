import SQLite from 'react-native-sqlite-storage';
import MealsSQLite from './MealsSQLite';
import SymptomsSQLite from './SymptomsSQLite';
import RemindersSQLite from './RemindersSQLite';
import awaitAsyncGenerator from '@babel/runtime/helpers/esm/awaitAsyncGenerator';
import UsersSQLite from './UsersSQLite';
SQLite.DEBUG(false);
SQLite.enablePromise(true);

const database_name = 'Reactoffline.db';
const database_version = '1.0';
const database_displayname = 'SQLite React Offline Database';
const database_size = 200000;

export default class Database {
  static db = null;

  static async initDB() {
    //console.log('Plugin integrity check ...');
    return new Promise((resolve, reject) => {
      SQLite.echoTest()
        .then(() => {
          // console.log('Integrity check passed ...');
          // console.log('Opening database ...');
          SQLite.openDatabase(
            database_name,
            database_version,
            database_displayname,
            database_size,
          ).then((DB) => {
            this.db = DB;
            this.executeQuery(
              'CREATE TABLE IF NOT EXISTS Reminders (reminderId, isScheduled, UNIQUE(reminderId))',
            );
            this.executeQuery(
              'CREATE TABLE IF NOT EXISTS Meals (userId, mealId, mealStarted, symptomNotes, UNIQUE(mealId))',
            );
            this.executeQuery(
              'CREATE TABLE IF NOT EXISTS MealSymptoms (userId, mealId, property, value, PRIMARY KEY(userId, mealId, property))',
            );
            this.executeQuery(
              'CREATE TABLE IF NOT EXISTS Users (userId, isFirstTime, PRIMARY KEY(userId))',
            );

            resolve();
          });
        })
        .catch((error) => {
          console.log(error);
          reject();
        });
    });
  }

  static executeQuery = (sql, params = []) =>
    new Promise((resolve, reject) => {
      if (this.db) {
        this.db.transaction((trans) => {
          trans.executeSql(
            sql,
            params,
            (trans, results) => {
              resolve(results);
            },
            (error) => {
              reject(error);
            },
          );
        });
      } else {
        // execute the query in a bit
        setTimeout(() => this.executeQuery(sql, params), 300);
      }
    });

  ///////////////////////////////////////////////REMINDERS/////////////////////////////////////////////////////////

  static async getReminderById(id) {
    let reminder = await RemindersSQLite.getReminderById(id, this);
    return reminder;
  }

  static async addReminder(rem) {
    let results = await RemindersSQLite.addReminder(rem, this);
    return results;
  }

  static async updateReminder(id, isScheduled) {
    let results = await RemindersSQLite.updateReminder(id, isScheduled, this);

    return results;
  }

  static async deleteReminder(id) {
    let results = await RemindersSQLite.deleteReminder(id, this);

    return results;
  }

  static async listReminders() {
    let reminders = await RemindersSQLite.listReminders(this);

    return reminders;
  }

  ///////////////////////////////////////////////MEALS/////////////////////////////////////////////////////////

  static async getAllMeals(userId) {
    return await MealsSQLite.getAllMeals(userId, this);
  }

  static async addNewMeal(
    userId: string,
    mealId: string,
    mealStarted: number,
    symptomNotes: string,
    symptoms: Object,
  ) {
    await MealsSQLite.addNewMeal(
      userId,
      mealId,
      mealStarted,
      symptomNotes,
      symptoms,
      this,
    );
  }

  static async deleteMeal(userId, mealId) {
    await MealsSQLite.deleteMeal(userId, mealId, this);
  }

  // N*M complexity
  // It's an AND operator
  static async getFilteredMeals(
    userId: string,
    filterOptions: Array,
    orSelected: boolean,
  ) {
    return await MealsSQLite.getFilteredMeals(
      userId,
      filterOptions,
      orSelected,
      this,
    );
  }

  static async getMealByID(userId, mealId): Object {
    let meal = await MealsSQLite.getMealByID(userId, mealId, this);
    return meal;
  }

  // fcn for tests
  static async deleteAllMeals() {
    await MealsSQLite.deleteAllMeals(this);
  }

  ///////////////////////////////////////////////SYMPTOMS/////////////////////////////////////////////////////////

  static async updateSymptomNote(userId, mealId, newSymptomNotes) {
    await SymptomsSQLite.updateSymptomNote(
      userId,
      mealId,
      newSymptomNotes,
      this,
    );
  }

  static async updateSymptoms(userId: string, mealId: string, symptoms: Array) {
    // update meal symptoms
    await SymptomsSQLite.updateSymptoms(userId, mealId, symptoms, this);
  }

  // fcn for tests mostly
  static async getAllMealSymptoms(userId) {
    return await SymptomsSQLite.getAllMealSymptoms(userId, this);
  }

  ///////////////////////////////////////////////USERS/////////////////////////////////////////////////////////

  static async addNewUser(userId) {
    return await UsersSQLite.addNewUser(userId, this);
  }

  // return user if exists, otherwise, return null
  static async checkIfUserExists(userId) {
    return await UsersSQLite.checkIfUserExists(userId, this);
  }

  //fcn for tests mostly
  static async getAllUsers() {
    return await UsersSQLite.getAllUsers(this);
  }

  static async updateUserFirstTimeStatus(userId, newStatus) {
    await UsersSQLite.updateUserFirstTimeStatus(userId, newStatus, this);
  }
}
