const express = require("express");
const res = require("express/lib/response");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//validates that an email is valid for new sign up
const validateEmail = function(email) {
  let isGood = true;
  if (email === "") {
    isGood = false;
  }

  for (let user in users) {
    if (users[user].email === email) {
      isGood = false;
    }
  }
  return isGood;
};

//validates that a password is good for signup
const validatePassword = function(password) {
  let isGood = true;
  if (password === "") {
    isGood = false;
  }

  return isGood;
};

//checks that an email is acceptable for login
const checkEmail = function(email) {
  let isGood = false;
  for (let user in users) {
    if (users[user].email === email) {
      isGood = true;
    }
  }
  return isGood;
};

const checkPassword = function(password) {
  let isGood = false;
  for (let user in users) {
    if (users[user].password === password) {
      isGood = true;
    }
  }
  return isGood;
};

const getUserIDbyEmail = function(email) {
  let id = "";
  for (let user in users) {
    if (users[user].email === email) {
      id = users[user].id;
    }
  }
  return id;
};

const generateRandomString = function() {
  let randomString = Math.random().toString(36).slice(2);
  randomString = randomString.slice(0,6);
  return randomString;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) =>  {
  const templateVars = {urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => {
  console.log(req.cookies["user_id"]);
  let render = "urls_new";
  if (req.cookies["user_id"] === undefined) {
    render = "login";
  }
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render(render, templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});


app.get("/urls", (req, res) => {

  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {

  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("login", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("*", (req, res) => {
  res.send("Sorry! the page does not exist");
});

app.post("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL;
  let change = req.body.longURL;
  urlDatabase[shortURL] = change;
  res.redirect("/urls/");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  res.redirect("/urls/");
  delete urlDatabase[shortURL];
});


app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
  // res.redirect(urlDatabase[shortURL]);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let redirect = "/urls/";
  if (checkEmail(email) && checkPassword(password)) {
    res.cookie("user_id", getUserIDbyEmail(email));
  } else {
    res.status(403);
    redirect = "/login";
  }

  res.redirect(redirect);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let randoID = generateRandomString();
  let redirect = "urls";
  let email = req.body.email;
  let password = req.body.password;
  if (validateEmail(email) && validatePassword(password)) {
    users[randoID] = {
      id: randoID,
      email,
      password
    };
    res.cookie("user_id", randoID);
  } else {
    res.status = 400;
    redirect = "/register";
  }

  res.redirect(redirect);
});

app.post("*", (req, res) => {
  res.status(404);
  res.send("404 ERROR");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});