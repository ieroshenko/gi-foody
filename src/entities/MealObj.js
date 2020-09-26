import {getMealItems} from '../wrappers/firestore/FirebaseWrapper';

export default class MealObj {
  constructor(builder) {
    this.userID = builder.userID;
    this.mealID = builder.mealID;
    this.mealStarted = builder.mealStarted;
    this.symptomNotes = builder.symptomNotes;
    this.mealSymptoms = builder.mealSymptoms;
    this.mealItems = [];
  }

  async obtainMealItems() {
    this.mealItems = await getMealItems(this.userID, this.mealID);
  }

  cloneMeal() {
    // clone without mealItems
    return new MealObj.Builder(this.userID, this.mealID)
      .withMealStarted(this.mealStarted)
      .withSymptomNotes(this.symptomNotes)
      .withMealSymptoms(this.mealSymptoms)
      .build();
  }

  // builder
  static get Builder() {
    class Builder {
      constructor(userID: string, mealID: string) {
        this.userID = userID;
        this.mealID = mealID;
      }

      withMealStarted(mealStarted) {
        this.mealStarted = mealStarted;
        return this;
      }

      withSymptomNotes(symptomNotes: string) {
        this.symptomNotes = symptomNotes;
        return this;
      }

      withMealSymptoms(mealSymptoms: Object) {
        this.mealSymptoms = mealSymptoms;
        return this;
      }

      build() {
        return new MealObj(this);
      }
    }

    return Builder;
  }
}
