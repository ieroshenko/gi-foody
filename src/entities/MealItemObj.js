import RNFetchBlob from 'rn-fetch-blob';
import {getMealItemImgUri} from '../wrappers/firestore/FirebaseWrapper';

export default class MealItemObj {
  userID: string;
  id: string;
  mealID: string;
  picID: string;
  notes: string;
  timeStamp;
  fromFavorites: boolean;
  isAndroid: boolean;
  uploadedToCloud: boolean;

  constructor(builder) {
    this.userID = builder.userID;
    this.id = builder.id;
    this.mealID = builder.mealID;

    this.picID = builder.picID;
    this.picPath = builder.picPath;
    this.notes = builder.notes;
    this.timeStamp = builder.timeStamp;
    this.fromFavorites = builder.fromFavorites;
    this.isAndroid = builder.isAndroid;
    this.uploadedToCloud = builder.uploadedToCloud;
  }

  async handleImgDownload() {
    await getMealItemImgUri(this.userID, this.picID);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  // builder
  static get Builder() {
    class Builder {
      constructor(userID: string, mealItemID: string, mealID: string) {
        this.userID = userID;
        this.id = mealItemID;
        this.mealID = mealID;
      }

      withPicID(picID: string) {
        this.picID = picID;
        this.picPath = `file://${RNFetchBlob.fs.dirs.CacheDir}/ImgCache/${picID}`;
        return this;
      }

      withNotes(notes: string) {
        this.notes = notes;
        return this;
      }

      withTimeStamp(timeStamp) {
        this.timeStamp = timeStamp;
        return this;
      }

      setFromFavorites(fromFavorites: boolean) {
        this.fromFavorites = fromFavorites;
        return this;
      }

      setIsAndroid(isAndroid: boolean) {
        this.isAndroid = isAndroid;
        return this;
      }

      setUploadedToCloud(uploadedToCloud: boolean) {
        this.uploadedToCloud = uploadedToCloud;
        return this;
      }

      build() {
        return new MealItemObj(this);
      }
    }

    return Builder;
  }
}
