// index.js

const express = require("express"); // express module을 import한다는 의미
const ejs = require("ejs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// express server와 연결하기 전에 데이터베이스와 연결함
// 데이터베이스는 data폴더에 apptest.db의 이름으로 저장됨.
// 미리 data 폴더 만들기
const db_name = path.join(__dirname, "data", "apptest.db");
const db = new sqlite3.Database(db_name, err => {
  if(err) {
    return console.error(err.message);
  }
  console.log("Successful connection to the database 'apptest.db'");
});



const sql_create = `CREATE TABLE IF NOT EXISTS Books (
  Book_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title VARCHAR(100) NOT NULL,
  Author VARCHAR(100) NOT NULL,
  Comments TEXT
);`;

// db.run : 첫번째 파라미터로 넘어온 sql query 실행, 그리고 두번째 파라미터인 callback함수 실행함
db.run(sql_create, err => {
  if( err ) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Books' table!");
});

  // Database seeding
  const sql_insert = `INSERT INTO Books (Book_ID, Title, Author, Comments) VALUES
  (1, 'Mrs. Bridge', 'Evan S. Connell', 'First in the serie'),
  (2, 'Mr. Bridge', 'Evan S. Connell', 'Second in the serie'),
  (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne');`;
  db.run(sql_insert, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Successful creation of 3 books");
  });


var app = express(); // Express server의 시작
var port = process.env.PORT || 5000;


app.set("view engine", "ejs"); // ejs 엔진을 사용한다고 선언하기
// views들이 views 폴더에 저장됨을 설정
app.set("views", path.join(__dirname, "views")); // app.set("views", __dirname + "/views"); 와 동일한 의미
app.use(express.static(path.join(__dirname, "public"))); // css와 같은 static file들이 저장된 경로 설정
app.use(express.urlencoded({extended: false})); // middleware configuration

app.listen(port, function() {
  console.log("Server started (http://localhost:5000/) !");
});

// 첫번째 파라미터 "/"에 전달된 HTTP GET request에 응답
app.get("/", (req, res) => {
  res.render("index");
  // HTTP의 body부분에 텍스트를 반환함
  // res.send ("Hello world...");
});

//function 추가
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/data", (req, res) => {
  const test = {
    title: "Test",
    items: ["one", "two", "three"]
  };
  res.render("data", {model: test});
});

app.get("/books", (req, res) => {
  const sql = "SELECT * FROM Books ORDER BY Title";
  // 1st: 실행할 쿼리
  // 2nd: 쿼리에 필요한 변수를 포함하는 배열, 이 경우에는 쿼리에 변수가 필요없어서 []값을 사용
  // 3rd: 쿼리 실행 후 부르는 callback function
  db.all(sql, [], (err, rows) => {
    if(err) {
      return console.error(err.message);
    }
    res.render("book", {model: rows});
  });
});

app.get("/edit/:id", (req, res)=> {
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID=?";
  db.get(sql, id, (err, row)=>{
    if(err) {
      console.error(err.message);
    }
    res.render("edit", {model:row});
  });
});

// Request.body에서 posted value를 받기 위해서는 middleware인 express.urlencoded()를 사용해야 한다.
// app.use()를 통해 수행할 수 있다.
app.post("/edit/:id", (req, res)=>{
  const id = req.params.id;
  const book = [req.body.Title, req.body.Author, req.body.Comments, id];
  const sql = "UPDATE Books SET Title=?, Author=?, Comments=? WHERE (Book_ID = ?)";
  db.run(sql, book, err=> {
    if(err) {
      console.error(err.message);
    }
    res.redirect("/books");
  })
});

app.get("/create", (req, res)=>{
  res.render("create", {model:{} });
});


app.post("/create", (req, res)=>{
  const book = [req.body.Title, req.body.Author, req.body.Comments];
  const sql = "INSERT INTO Books (Title, Author, Comments) VALUES (?, ?, ?)";
  db.run(sql, book, err=> {
    if(err){
      console.error(err.message);
    }
    res.redirect("/books");
  });
});


app.get("/delete/:id", (req, res)=>{
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID=?";
  db.get(sql, id, (err, row)=>{
    if(err) {
      console.error(err.message);
    }
    res.render("delete", {model: row});
  });
});

app.post("/delete/:id", (req, res)=> {
  const id = req.params.id;
  const sql = "DELETE FROM Books WHERE Book_ID=?";
  db.run(sql, id, err =>{
    if(err) {
      console.error(err.message);
    }
    res.redirect("/books");
  });
});
