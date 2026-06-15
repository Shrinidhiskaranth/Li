const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("library.db", (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connecting to Database Library......');
        console.log('Connected to Database Library.');
    }
});

db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS LIBRARIANS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Table Librarians Created Successfully.");
            }
        }
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS STUDENTS(
            usn PRIMARY KEY,
            name TEXT,
            branch TEXT
        )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Table Students Created Successfully.");
            }
        }
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS BOOKS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            quantity INTEGER
        )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Table Books Created Successfully.");
            }
        }
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS BORROWED_BOOKS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usn TEXT,
            book_id INTEGER,
            borrow_date TEXT,
            return_date TEXT,
            status TEXT
        )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Table Borrowed_Books Created Successfully.");
            }
        }
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS LIBRARY_VISITS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usn TEXT,
            entry_time TEXT,
            exit_time TEXT,
            duration TEXT
        )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Table Library_Visits Created Successfully.");
            }
        }
    );

    db.run(
        `INSERT OR IGNORE INTO LIBRARIANS(id, name, email, password) VALUES
        (1, 'Shrinidhi', 'shrinidhikaranth2006@gmail.com', 'alaje@2006'),
        (2, 'Shreya', 'shreyagaminh2006@gmail.com', 'shreya@2006'),
        (3, 'Sudhanva', 'sudhanva2006@gmail.com', 'sudhanava@2006')`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Inserted Values into Table Librarians Successfully.");
            }
        }
    );

    db.all(`SELECT * FROM LIBRARIANS`, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Table : Librarians");
            console.table(rows);
        }
    });
});

module.exports = db;
