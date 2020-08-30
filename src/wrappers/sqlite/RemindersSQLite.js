export default class RemindersSQLite {
  static getReminderById(id, db) {
    return new Promise((resolve) => {
      db.db
        .transaction((tx) => {
          tx.executeSql('SELECT * FROM Reminders WHERE reminderId = ?', [
            id,
          ]).then(([tx, results]) => {
            if (results.rows.length > 0) {
              let row = results.rows.item(0);
              resolve(row);
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  static addReminder(rem, db) {
    return new Promise((resolve) => {
      db.db
        .transaction((tx) => {
          tx.executeSql('INSERT OR IGNORE INTO Reminders VALUES (?, ?)', [
            rem.id,
            rem.isScheduled,
          ]).then(([tx, results]) => {
            resolve(results);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  static updateReminder(id, isScheduled, db) {
    return new Promise((resolve) => {
      db.db
        .transaction((tx) => {
          tx.executeSql(
            'UPDATE Reminders SET isScheduled = ? WHERE reminderId = ?',
            [isScheduled, id],
          ).then(([tx, results]) => {
            resolve(results);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  static deleteReminder(id, db) {
    return new Promise((resolve) => {
      db.db
        .transaction((tx) => {
          tx.executeSql('DELETE FROM Reminders WHERE reminderId = ?', [
            id,
          ]).then(([tx, results]) => {
            resolve(results);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  static listReminders(db) {
    return new Promise((resolve) => {
      const reminders = [];
      db.db
        .transaction((tx) => {
          tx.executeSql(
            'SELECT r.reminderId, r.isScheduled FROM Reminders r',
            [],
          ).then(([tx, results]) => {
            let len = results.rows.length;
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              const {reminderId, isScheduled} = row;
              reminders.push({
                reminderId,
                isScheduled,
              });
            }
            resolve(reminders);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
}
