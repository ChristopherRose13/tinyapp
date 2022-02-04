/* eslint-disable camelcase */
const express = require("express");
const helper = require("./helpers");
const res = require("express/lib/response");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { redirect, send } = require("express/lib/response");
const req = require("express/lib/request");

app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["dinsoaur", "hello", "mustard"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password"
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

//logs the user in if the email and password exist and match the user
const authLogin = function(users, email, password) {
  for (let user in users) {
    const userEmailFound = helper.findEmail(users, email);
    console.log("passed word:", password);
    console.log("user ", users[user].password);
    if (userEmailFound && bcrypt.compareSync(password, users[user].password) && users[user].email === email) {
      return user;
    }
  }
  return false;
};

//returns the urls that a user has created
const getURLsByUser = function(user) {

  let urls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

//redirects user to /urls if they dont specify a page
app.get("/", (req, res) => {
  
  if (!req.session) {
    const templateVars = {err_msg: "Please login"};
    res.render("/login", templateVars);
  }

  if (req.session) {
    return res.redirect("/urls");
  }

  res.write("How did you get here??");
});

app.get("/urls.json", (req, res) =>  {

  const templateVars = {urls: urlDatabase, user: req.session.user_id};
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {

  const templateVars = {user: undefined};
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => {
  
  if (req.session.user_id === null) {
    
    return res.redirect("/login");
  }
  const templateVars = {user: req.session.user_id};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let shortUrl = req.params.shortURL;

  if (!req.session.user_id) {
    res.status(404).send("Please login to view");
  }

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("Not a valid URL");
  }
  //returns users urls and if the shortUrl matches it sends the user to the url page
  const userUrls = getURLsByUser(req.session.user_id);
  if (userUrls[shortUrl]) {
    const templateVars = { shortURL: shortUrl, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session.user_id};
    res.render("urls_show", templateVars);
  }

  if (!userUrls[shortUrl]) {
    res.status(404).send("url does not exist");
  }

});

app.get("/urls", (req, res) => {

  const session_user_id = req.session["user_id"];

  if (!session_user_id) {
    res.status(404).send("Please login to view");
  }
  let userUrls;

  if (session_user_id !== null) {
    userUrls = helper.fetchUserUrls(urlDatabase, session_user_id);
  }
  
  const user = users[`${session_user_id}`];
  
  const templateVars = {
    user: user,
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const session_user_id = req.session["user_id"];
  
  if (session_user_id) {
    console.log(session_user_id);
    res.status(403).send("You are already logged in");
  }
  
  const user = users[session_user_id];
  const templateVars = { urls: urlDatabase, user, err_msg: ""};
  res.render("login", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    res.status(404).send("Sorry! the page does not exist");
  }

  res.redirect(longURL);
});

//logs user out and deletes cookies
app.post("/logout", (req, res) => {
  // eslint-disable-next-line camelcase
  // req.session.user_id = null;
  req.session = null;
  res.redirect("/login");
});

//creates a short url link
app.post("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL;
 
  let change = req.body.longURL;

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    urlDatabase[shortURL]["longURL"] = change;
  }

  res.redirect("/urls/");
});

//deletes a short url link
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls/");
});

//sends the user to the /urls page
app.post("/urls", (req, res) => {
  const session_user_id = req.session["user_id"];
  if (!session_user_id) {
    res.status(403).send("please login to view");
  }
  let shortURL = helper.generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect("/urls/" + shortURL);

});

//logs the user in
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const session_user_id = req.session["user_id"];

  //input validation
  if (!email || !password) {
    const templateVars = {
      
      user: users[session_user_id],
      
      err_msg: "email or password cannot be empty"
    };
    res.render("login", templateVars);
    return;
  }

  //returns the user id if the login credentials match
  const findUser = authLogin(users, email, password);
 
  //error handling for if the user does not exist
  if (!findUser) {
    const user = users[session_user_id];
    const templateVars = {
      user,
      err_msg: `Sorry the email : ${email} or password ${password} is not available`
    };
    return res.render("login", templateVars);
  }

  //if no errors redirectst to /urls
  req.session["user_id"] = findUser;
  return res.redirect("/urls");
});

//registers a new user
app.post("/register", (req, res) => {
  let randoID = helper.generateRandomString();
  let redirect = "urls";
  let email = req.body.email;
  let password = req.body.password;

  if (validateEmail(email) && helper.validatePassword(password)) {
    password = bcrypt.hashSync(password, 10);
    users[randoID] = {
      id: randoID,
      email,
      password
    };
    
    req.session.user_id = randoID;
  } else {
    //error handling if the email or passowrd is already used or too does not exist
    res.status(403).send("email or password are not available");
    redirect = "/register";
  }

  res.redirect(redirect);
});


app.get("*", (req, res) => {
  res.send("Sorry! the page does not exist");
});

app.post("*", (req, res) => {
  res.status(404);
  res.send("404 ERROR");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});