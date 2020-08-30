export default class MealsSQLite {
  static async getAllMeals(userId, db) {
    const meals = [];

    // get the Meals
    let mealQueryresults = await db.executeQuery(
      'SELECT * FROM Meals WHERE userId = ? ORDER BY mealStarted DESC',
      [userId],
    );

    let len = mealQueryresults.rows.length;
    for (let i = 0; i < len; i++) {
      let row = mealQueryresults.rows.item(i);
      const {userId, mealId, mealStarted, symptomNotes} = row;

      // for every meal, get corresponding symptoms + their values
      let mealSymptomResults = await db.executeQuery(
        'SELECT ms.property, ms.value FROM MealSymptoms ms WHERE userId = ? AND mealId = ?',
        [userId, mealId],
      );

      let symptomEntries = {};
      let mealSympLen = mealSymptomResults.rows.length;
      for (let i = 0; i < mealSympLen; i++) {
        let mealSympRow = mealSymptomResults.rows.item(i);
        const {property, value} = mealSympRow;

        symptomEntries[property] = value;
      }

      let meal = {
        id: mealId,
        mealStarted: mealStarted,
        symptomNotes: symptomNotes,
        mealSymptoms: symptomEntries,
      };

      meals.push(meal);
    }

    return meals;
  }

  static async addNewMeal(
    userId: string,
    mealId: string,
    mealStarted: number,
    symptomNotes: string,
    symptoms: Object,
    db,
  ) {
    await db.executeQuery('INSERT OR REPLACE INTO Meals VALUES (?, ?, ?, ?)', [
      userId,
      mealId,
      mealStarted,
      symptomNotes,
    ]);

    // initialize meal symptoms
    for (let [symptom, value] of Object.entries(symptoms)) {
      await db.executeQuery(
        'INSERT OR REPLACE INTO MealSymptoms VALUES(?, ?, ?, ?)',
        [userId, mealId, symptom, value],
      );
    }
  }

  static async deleteMeal(userId, mealId, db) {
    // delete meal
    await db.executeQuery('DELETE FROM Meals WHERE userId = ? AND mealId = ?', [
      userId,
      mealId,
    ]);

    // delete corresponding symptomEntries
    await db.executeQuery(
      'DELETE FROM MealSymptoms WHERE userId = ? AND mealId = ?',
      [userId, mealId],
    );
  }

  // N*M complexity
  // It's an AND operator
  static async getFilteredMeals(
    userId: string,
    filterOptions: Array,
    orSelected: boolean,
    db,
  ) {
    let allMeals = await this.getAllMeals(userId, db);
    let filteredMeals = allMeals.filter((meal) => {
      for (let i = 0; i < filterOptions.length; i++) {
        let option = filterOptions[i];

        if (option.operator) {
          if (option.operator === '>=') {
            if (orSelected) {
              if (meal.mealSymptoms[option.sympName] >= option.filterValue) {
                return true;
              }
            } else {
              if (!(meal.mealSymptoms[option.sympName] >= option.filterValue)) {
                return false;
              }
            }
          } else if (option.operator === '==') {
            if (orSelected) {
              if (meal.mealSymptoms[option.sympName] === option.filterValue) {
                return true;
              }
            } else {
              if (meal.mealSymptoms[option.sympName] !== option.filterValue) {
                return false;
              }
            }
          } else if (option.operator === '<=') {
            if (orSelected) {
              if (meal.mealSymptoms[option.sympName] <= option.filterValue) {
                return true;
              }
            } else {
              if (!(meal.mealSymptoms[option.sympName] <= option.filterValue)) {
                return false;
              }
            }
          }
        }
      }

      return !orSelected;
    });

    return filteredMeals;
  }

  static async getMealByID(userId, mealId, db): Object {
    let mealResults = await db.executeQuery(
      'SELECT * FROM Meals WHERE userId = ? AND mealId = ?',
      [userId, mealId],
    );
    let meal;

    if (mealResults.rows.length > 0) {
      meal = mealResults.rows.item(0);
    }

    // get corresponding meal Symptoms
    let mealSymptomResults = await db.executeQuery(
      'SELECT ms.property, ms.value FROM MealSymptoms ms WHERE userId = ? AND mealId = ?',
      [userId, mealId],
    );

    let symptomEntries = {};
    let mealSympLen = mealSymptomResults.rows.length;
    for (let i = 0; i < mealSympLen; i++) {
      let mealSympRow = mealSymptomResults.rows.item(i);
      const {property, value} = mealSympRow;

      symptomEntries[property] = value;
    }

    meal = {
      ...meal,
      mealSymptoms: symptomEntries,
    };

    return meal;
  }

  static async deleteAllMeals(db) {
    await db.executeQuery('DELETE FROM Meals');
    await db.executeQuery('DELETE FROM MealSymptoms');
  }
}
