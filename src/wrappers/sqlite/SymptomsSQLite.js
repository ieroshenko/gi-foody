export default class SymptomsSQLite {
  // fcn for tests
  static async getAllMealSymptoms(userId, db) {
    const mealSymptoms = [];
    let results = await db.executeQuery(
      'SELECT ms.userId, ms.mealId, ms.property, ms.value FROM MealSymptoms ms WHERE userId = ?',
      [userId],
    );

    let len = results.rows.length;
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i);
      const {userId, mealId, property, value} = row;
      mealSymptoms.push({
        userId,
        mealId,
        property,
        value,
      });
    }
    console.log(mealSymptoms);
    return mealSymptoms;
  }

  static async updateSymptomNote(userId, mealId, newSymptomNotes, db) {
    await db.executeQuery(
      'UPDATE Meals SET symptomNotes = ? WHERE userId = ? AND mealId = ?',
      [newSymptomNotes, userId, mealId],
    );
  }

  static async updateSymptoms(
    userId: string,
    mealId: string,
    symptoms: Array,
    db,
  ) {
    // update meal symptoms
    for (let [symptom, value] of symptoms) {
      await db.executeQuery(
        'INSERT OR REPLACE INTO MealSymptoms VALUES(?, ?, ?, ?)',
        [userId, mealId, symptom, value],
      );
    }
  }
}
