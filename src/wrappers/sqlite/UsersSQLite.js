export default class UsersSQLite {
  static async addNewUser(userId, db) {
    let results = await db.executeQuery(
      'INSERT OR IGNORE INTO Users VALUES(?, ?, ?)',
      [userId, true, 0],
    );

    return results;
  }

  static async checkIfUserExists(userId, db) {
    let results = await db.executeQuery(
      'SELECT * FROM Users WHERE userId = ?',
      [userId],
    );

    if (results.rows.length > 0) {
      let row = results.rows.item(0);
      return row;
    } else {
      return null;
    }
  }

  static async updateUserLastFetchedProp(
    db,
    userId: string,
    lastFetched: number,
  ) {
    await db.executeQuery('UPDATE Users SET lastFetched = ? WHERE userId = ?', [
      lastFetched,
      userId,
    ]);
  }

  //fcn for tests mostly
  static async getAllUsers(db) {
    let users = [];

    let results = await db.executeQuery('SELECT * FROM Users');

    let len = results.rows.length;
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i);
      const {userId, isFirstTime, lastFetched} = row;
      users.push({
        userId,
        isFirstTime,
        lastFetched,
      });
    }

    console.log(users);
    return users;
  }

  static async updateUserFirstTimeStatus(userId, newStatus, db) {
    await db.executeQuery('UPDATE Users SET isFirstTime = ? WHERE userId = ?', [
      newStatus,
      userId,
    ]);
  }
}
