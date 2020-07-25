import SQLite from 'react-native-sqlite-storage';
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'Reactoffline.db';
const database_version = '1.0';
const database_displayname = 'SQLite React Offline Database';
const database_size = 200000;

export default class Database {
  initDB() {
    let db;
    return new Promise((resolve) => {
      //console.log('Plugin integrity check ...');
      SQLite.echoTest()
        .then(() => {
          // console.log('Integrity check passed ...');
          // console.log('Opening database ...');
          SQLite.openDatabase(
            database_name,
            database_version,
            database_displayname,
            database_size,
          )
            .then((DB) => {
              db = DB;
              // console.log('Database OPEN');
              db.executeSql('SELECT 1 FROM Reminders LIMIT 1')
                .then(() => {
                  console.log('Database is ready ... executing query ...');
                })
                .catch((error) => {
                  // console.log('Received error: ', error);
                  // console.log('Database not yet ready ... populating data');
                  db.transaction((tx) => {
                    tx.executeSql(
                      'CREATE TABLE IF NOT EXISTS Reminders (reminderId, isScheduled, UNIQUE(reminderId))',
                    );
                  })
                    .then(() => {
                      console.log('Table created successfully');
                    })
                    .catch((error) => {
                      // console.log(error);
                    });
                });
              resolve(db);
            })
            .catch((error) => {
              // console.log(error);
            });
        })
        .catch((error) => {
          // console.log(error);
          // console.log('echoTest failed - plugin not functional');
        });
    });
  }

  closeDatabase(db) {
    if (db) {
      // console.log('Closing DB');
      db.close()
        .then((status) => {
          console.log('Database CLOSED');
        })
        .catch((error) => {
          // console.log(error);
        });
    } else {
      // console.log('Database was not OPENED');
    }
  }

  getReminderById(id) {
    // console.log(id);
    return new Promise((resolve) => {
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            tx.executeSql('SELECT * FROM Reminders WHERE reminderId = ?', [
              id,
            ]).then(([tx, results]) => {
              // console.log(results);
              if (results.rows.length > 0) {
                let row = results.rows.item(0);
                resolve(row);
              }
            });
          })
            .then((result) => {
              this.closeDatabase(db);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  addReminder(rem) {
    return new Promise((resolve) => {
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            tx.executeSql('INSERT OR IGNORE INTO Reminders VALUES (?, ?)', [
              rem.id,
              rem.isScheduled,
            ]).then(([tx, results]) => {
              resolve(results);
            });
          })
            .then((result) => {
              this.closeDatabase(db);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  updateReminder(id, isScheduled) {
    return new Promise((resolve) => {
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            tx.executeSql(
              'UPDATE Reminders SET isScheduled = ? WHERE reminderId = ?',
              [isScheduled, id],
            ).then(([tx, results]) => {
              resolve(results);
            });
          })
            .then((result) => {
              this.closeDatabase(db);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  deleteReminder(id) {
    return new Promise((resolve) => {
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            tx.executeSql('DELETE FROM Reminders WHERE reminderId = ?', [
              id,
            ]).then(([tx, results]) => {
              // console.log(results);
              resolve(results);
            });
          })
            .then((result) => {
              this.closeDatabase(db);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  listReminders() {
    return new Promise((resolve) => {
      const reminders = [];
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            tx.executeSql(
              'SELECT r.reminderId, r.isScheduled FROM Reminders r',
              [],
            ).then(([tx, results]) => {
              // console.log('Query completed');
              let len = results.rows.length;
              for (let i = 0; i < len; i++) {
                let row = results.rows.item(i);
                // console.log('row:', row);
                const {reminderId, isScheduled} = row;
                reminders.push({
                  reminderId,
                  isScheduled,
                });
              }
              // console.log(reminders);
              resolve(reminders);
            });
          })
            .then((result) => {
              this.closeDatabase(db);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
}
