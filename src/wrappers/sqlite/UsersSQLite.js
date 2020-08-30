export default class UsersSQLite {
  static async addNewUser(userId, db) {
    let results = await db.executeQuery(
      'INSERT OR IGNORE INTO Users VALUES(?, ?)',
      [userId, true],
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

  //fcn for tests mostly
  static async getAllUsers(db) {
    let users = [];

    let results = await db.executeQuery('SELECT * FROM Users');

    let len = results.rows.length;
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i);
      const {userId, isFirstTime} = row;
      users.push({
        userId,
        isFirstTime,
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
