const express = require('express');
const path = require('path');
const db = require('./db');
const session = require('express-session');
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
    session({
        secret: "librarysecret",
        resave: false,
        saveUninitialized: false
    })
);

// --- AUTH ---
app.get('/', (request, response) => {
    response.render("login", { error: null });
});

function isLoggedIn(request, response, next) {
    if (request.session.librarian) {
        next();
    } else {
        response.redirect('/');
    }
}

app.post('/login', (request, response) => {
    const email = request.body.email;
    const password = request.body.password;
    db.get(`SELECT * FROM LIBRARIANS WHERE email=? AND password=?`, [email, password], (err, row) => {
        if (err) {
            console.log(err.message);
            response.render("login", { error: "Something went wrong. Please try again." });
        } else if (row) {
            request.session.librarian = row;
            response.redirect("/dashboard");
        } else {
            response.render("login", { error: "Invalid Credentials!" });
        }
    });
});

app.get('/logout', (request, response) => {
    request.session.destroy(() => {
        response.redirect('/');
    });
});

// --- DASHBOARD ---
app.get("/dashboard", isLoggedIn, (request, response) => {
    db.get(`SELECT COUNT(*) AS totalBooks FROM BOOKS`, (err, books) => {
        db.get(`SELECT COUNT(*) AS totalBorrowed FROM BORROWED_BOOKS WHERE status='Borrowed'`, (err, borrowed) => {
            db.get(`SELECT COUNT(DISTINCT usn) AS totalVisits FROM LIBRARY_VISITS`, (err, visits) => {
                response.render("dashboard", {
                    librarian: request.session.librarian,
                    totalBooks: books.totalBooks,
                    totalBorrowed: borrowed.totalBorrowed,
                    totalVisits: visits.totalVisits
                });
            });
        });
    });
});

// --- BOOKS ---
app.get('/books', isLoggedIn, (request, response) => {
    const search = request.query.search || "";
    db.all(`SELECT * FROM BOOKS WHERE title LIKE ? OR author LIKE ?`, [`%${search}%`, `%${search}%`], (err, rows) => {
        if (err) {
            console.log(err.message);
            response.send("Error fetching books");
        } else {
            response.render("books", { books: rows, search: search });
        }
    });
});

app.get('/books/add', isLoggedIn, (request, response) => {
    response.render("addBook");
});

app.post('/books/add', isLoggedIn, (request, response) => {
    const title = request.body.title;
    const author = request.body.author;
    const quantity = request.body.quantity;
    db.run(`INSERT INTO BOOKS(title, author, quantity) VALUES(?, ?, ?)`, [title, author, quantity], (err) => {
        if (!err) {
            response.redirect('/books');
        } else {
            console.log(err.message);
        }
    });
});

app.get('/books/delete/:id', isLoggedIn, (request, response) => {
    db.run(`DELETE FROM BOOKS WHERE id=?`, [request.params.id], (err) => {
        if (!err) {
            response.redirect('/books');
        }
    });
});

app.get('/books/edit/:id', isLoggedIn, (request, response) => {
    db.get(`SELECT * FROM BOOKS WHERE id=?`, [request.params.id], (err, row) => {
        if (err) {
            console.log(err.message);
            response.send("Error loading book");
        } else {
            response.render("editBook", { book: row });
        }
    });
});

app.post('/books/edit/:id', isLoggedIn, (request, response) => {
    const title = request.body.title;
    const author = request.body.author;
    const quantity = request.body.quantity;
    db.run(`UPDATE BOOKS SET title=?, author=?, quantity=? WHERE id=?`, [title, author, quantity, request.params.id], (err) => {
        if (!err) {
            response.redirect('/books');
        }
    });
});

// --- STUDENTS ---
app.get('/students', isLoggedIn, (request, response) => {
    const search = request.query.search || "";
    db.all(`SELECT * FROM STUDENTS WHERE usn LIKE ? OR name LIKE ?`, [`%${search}%`, `%${search}%`], (err, rows) => {
        if (err) {
            console.log(err.message);
            response.send("Error fetching students");
        } else {
            response.render("students", { students: rows, search: search });
        }
    });
});

app.get('/students/add', isLoggedIn, (request, response) => {
    response.render("addStudent");
});

app.post('/students/add', isLoggedIn, (request, response) => {
    const usn = request.body.usn;
    const name = request.body.name;
    const branch = request.body.branch;
    db.run(`INSERT INTO STUDENTS(usn, name, branch) VALUES(?, ?, ?)`, [usn, name, branch], (err) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('/students');
        }
    });
});

app.get('/students/delete/:usn', isLoggedIn, (request, response) => {
    db.run(`DELETE FROM STUDENTS WHERE usn=?`, [request.params.usn], (err) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('/students');
        }
    });
});

app.get('/students/edit/:usn', isLoggedIn, (request, response) => {
    db.get(`SELECT * FROM STUDENTS WHERE usn=?`, [request.params.usn], (err, row) => {
        if (err) {
            console.log(err);
        } else {
            response.render("editStudent", { student: row });
        }
    });
});

app.post('/students/edit/:usn', isLoggedIn, (request, response) => {
    const name = request.body.name;
    const branch = request.body.branch;
    db.run(`UPDATE STUDENTS SET name=?, branch=? WHERE usn=?`, [name, branch, request.params.usn], (err) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('/students');
        }
    });
});

// --- BORROWED BOOKS ---
app.get('/borrowed-books', isLoggedIn, (request, response) => {
    const search = request.query.search || "";
    db.all(
        `SELECT BORROWED_BOOKS.*, STUDENTS.name, BOOKS.title FROM BORROWED_BOOKS
         JOIN STUDENTS ON BORROWED_BOOKS.usn = STUDENTS.usn
         JOIN BOOKS ON BORROWED_BOOKS.book_id = BOOKS.id
         WHERE BORROWED_BOOKS.usn LIKE ? OR STUDENTS.name LIKE ? OR BOOKS.title LIKE ?`,
        [`%${search}%`, `%${search}%`, `%${search}%`],
        (err, rows) => {
            if (err) {
                console.log(err.message);
                response.send("Error fetching borrowed books");
            } else {
                response.render("borrowedBooks", { borrowedBooks: rows, search: search });
            }
        }
    );
});

app.get('/borrowed-books/add', isLoggedIn, (request, response) => {
    db.all(`SELECT * FROM STUDENTS`, (err, students) => {
        db.all(`SELECT * FROM BOOKS`, (err, books) => {
            response.render("issueBook", { students: students, books: books });
        });
    });
});

app.post('/borrowed-books/add', isLoggedIn, (request, response) => {
    const usn = request.body.usn;
    const book_id = request.body.book_id;
    const borrow_date = request.body.borrow_date;
    const return_date = request.body.return_date;
    db.run(
        `INSERT INTO BORROWED_BOOKS(usn, book_id, borrow_date, return_date, status) VALUES(?, ?, ?, ?, ?)`,
        [usn, book_id, borrow_date, return_date, 'Borrowed'],
        (err) => {
            if (err) {
                console.log(err);
            } else {
                response.redirect('/borrowed-books');
            }
        }
    );
});

app.get('/borrowed-books/return/:id', isLoggedIn, (request, response) => {
    db.run(`UPDATE BORROWED_BOOKS SET status='Returned' WHERE id=?`, [request.params.id], (err) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('/borrowed-books');
        }
    });
});

// --- LIBRARY VISITS ---
app.get('/library-visits', isLoggedIn, (request, response) => {
    db.all(
        `SELECT lv.id, lv.usn, s.name, lv.entry_time, lv.exit_time, lv.duration
         FROM LIBRARY_VISITS lv
         JOIN STUDENTS s ON lv.usn = s.usn
         ORDER BY lv.id DESC`,
        (err, rows) => {
            if (err) {
                console.log(err.message);
                response.send("Error loading visits.");
            } else {
                response.render("libraryVisits", { visits: rows });
            }
        }
    );
});

app.get('/library-visits/add', isLoggedIn, (request, response) => {
    db.get(`SELECT COUNT(*) AS totalIn FROM LIBRARY_VISITS WHERE exit_time IS NULL`, (err, count) => {
        const result = request.session.result;
        request.session.result = null;
        response.render('visitEntry', { totalIn: count.totalIn, result: result });
    });
});

app.post('/library-visits/add', isLoggedIn, (request, response) => {
    const usn = request.body.usn;
    const currentTime = new Date();
    db.get(
        `SELECT STUDENTS.name, LIBRARY_VISITS.id, LIBRARY_VISITS.entry_time
         FROM STUDENTS
         LEFT JOIN LIBRARY_VISITS ON STUDENTS.usn = LIBRARY_VISITS.usn AND LIBRARY_VISITS.exit_time IS NULL
         WHERE STUDENTS.usn = ?`,
        [usn],
        (err, row) => {
            if (err) {
                request.session.result = { error: "Something went wrong." };
                return response.redirect('/library-visits/add');
            }
            if (!row) {
                request.session.result = { error: "Student not found." };
                return response.redirect('/library-visits/add');
            }
            if (!row.id) {
                db.run(`INSERT INTO LIBRARY_VISITS(usn, entry_time) VALUES(?, ?)`, [usn, currentTime.toISOString()], (err) => {
                    request.session.result = {
                        name: row.name,
                        usn: usn,
                        status: "IN",
                        inTime: currentTime.toLocaleString()
                    };
                    response.redirect('/library-visits/add');
                });
            } else {
                const entryTime = new Date(row.entry_time);
                const durationMs = currentTime - entryTime;
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                db.run(
                    `UPDATE LIBRARY_VISITS SET exit_time=?, duration=? WHERE id=?`,
                    [currentTime.toISOString(), `${hours} Hours ${minutes} Minutes`, row.id],
                    (err) => {
                        request.session.result = {
                            name: row.name,
                            usn: usn,
                            status: "OUT",
                            outTime: currentTime.toLocaleString(),
                            duration: `${hours} Hours ${minutes} Minutes`
                        };
                        response.redirect('/library-visits/add');
                    }
                );
            }
        }
    );
});

    // Quick check-in by USN (GET) - creates a new entry if student exists and not already inside
    app.get('/library-visits/checkin/:usn', isLoggedIn, (request, response) => {
        const usn = request.params.usn;
        const currentTime = new Date();
        db.get(
            `SELECT STUDENTS.name, LIBRARY_VISITS.id FROM STUDENTS
             LEFT JOIN LIBRARY_VISITS ON STUDENTS.usn = LIBRARY_VISITS.usn AND LIBRARY_VISITS.exit_time IS NULL
             WHERE STUDENTS.usn = ?`,
            [usn],
            (err, row) => {
                if (err) {
                    console.log(err.message);
                    return response.redirect('/library-visits');
                }
                if (!row) {
                    // student not found
                    request.session.result = { error: 'Student not found.' };
                    return response.redirect('/library-visits');
                }
                if (row.id) {
                    // already inside
                    request.session.result = { error: 'Student already checked in.' };
                    return response.redirect('/library-visits');
                }
                db.run(`INSERT INTO LIBRARY_VISITS(usn, entry_time) VALUES(?, ?)`, [usn, currentTime.toISOString()], (err) => {
                    if (err) console.log(err.message);
                    request.session.result = { name: row.name, usn: usn, status: 'IN', inTime: currentTime.toLocaleString() };
                    return response.redirect('/library-visits');
                });
            }
        );
    });

    // Quick check-out by visit id (GET) - sets exit_time and duration
    app.get('/library-visits/checkout/:id', isLoggedIn, (request, response) => {
        const id = request.params.id;
        const currentTime = new Date();
        db.get(`SELECT id, usn, entry_time FROM LIBRARY_VISITS WHERE id = ? AND exit_time IS NULL`, [id], (err, row) => {
            if (err) {
                console.log(err && err.message);
                return response.redirect('/library-visits');
            }
            if (!row) {
                request.session.result = { error: 'Active visit not found.' };
                return response.redirect('/library-visits');
            }
            const entryTime = new Date(row.entry_time);
            const durationMs = currentTime - entryTime;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            db.run(`UPDATE LIBRARY_VISITS SET exit_time=?, duration=? WHERE id=?`, [currentTime.toISOString(), `${hours} Hours ${minutes} Minutes`, id], (err) => {
                if (err) console.log(err.message);
                request.session.result = { name: null, usn: row.usn, status: 'OUT', outTime: currentTime.toLocaleString(), duration: `${hours} Hours ${minutes} Minutes` };
                return response.redirect('/library-visits');
            });
        });
    });

app.get('/library-visits/delete/:id', isLoggedIn, (request, response) => {
    db.run(`DELETE FROM LIBRARY_VISITS WHERE id=?`, [request.params.id], (err) => {
        if (err) {
            console.log(err.message);
        }
        response.redirect('/library-visits');
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});

