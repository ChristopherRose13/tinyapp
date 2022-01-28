const express = require("express");
const helper = require("./helpers");
const res = require("express/lib/response");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { redirect } = require("express/lib/response");
const req = require("express/lib/request");
const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);

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
    password: "$2a$10$rejKRGWIZdqnezjr5Xo4ZeAHKueb6Av85MUCz/25LFa//tRirPi.u"
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


const findEmail = (users, email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const authLogin = function(users, email, password) {
  for (let user in users) {
    const userEmailFound = findEmail(users, email);

    if (userEmailFound && bcrypt.compareSync(password, users[user].password)) {
      return users[user];
    }
  }
  return false;
};

const generateRandomString = function() {
  let randomString = Math.random().toString(36).slice(2);
  randomString = randomString.slice(0,6);
  return randomString;
};

const fetchUserUrls = (urlDatabase, sessionID) => {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === sessionID) {
      userUrls[shortUrl] = {
        userID: sessionID,
        longURL: urlDatabase[shortUrl].longURL
      };

    }
  }
  
  return userUrls;
};
// fetching all urls for unregistered user
const fetchAllUrls = () => {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    userUrls[shortUrl] = urlDatabase[shortUrl].longURL;
  }
  return userUrls;
};

app.get("/", (req, res) => {
  if (!req.session) {
    // eslint-disable-next-line camelcase
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
  if (req.session.user_id === null) {
    return res.redirect("/login");
  }

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("Not a valid URL");
  }
  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session.user_id};
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  // eslint-disable-next-line camelcase
  const session_user_id = req.session["user_id"];

  // eslint-disable-next-line camelcase
  if (session_user_id === null) {
    return res.redirect("/login");
  }
  let userUrls;

  // eslint-disable-next-line camelcase
  if (session_user_id !== null) {
    userUrls = fetchUserUrls(urlDatabase, session_user_id);
  }
  // eslint-disable-next-line camelcase
  const user = users[`${session_user_id}`];
  
  const templateVars = {
    user: user,
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  // eslint-disable-next-line camelcase
  const session_user_id = req.session["user_id"];
  // eslint-disable-next-line camelcase
  if (session_user_id !== null) {
    return redirect("/urls");
  }
  // eslint-disable-next-line camelcase
  const user = users[session_user_id];
  // eslint-disable-next-line camelcase
  const templateVars = { urls: urlDatabase, user, err_msg: ""};
  res.render("login", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.get("/logout", (req, res) => {
  // eslint-disable-next-line camelcase
  req.session.user_id = null;
  res.redirect("/urls");
});


app.post("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL;
 
  let change = req.body.longURL;

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    urlDatabase[shortURL]["longURL"] = change;
  }

  res.redirect("/urls/");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls/");
});


app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect("/urls/" + shortURL);
  // res.redirect(urlDatabase[shortURL]);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  // eslint-disable-next-line camelcase
  const session_user_id = req.session["user_id"];
  if (email === "" || password === "") {
    const templateVars = {
      // eslint-disable-next-line camelcase
      user: users[session_user_id],
      // eslint-disable-next-line camelcase
      err_msg: "email or password cannot be empty"
    };
    res.render("login", templateVars);
    return;
  }
  const findUser = authLogin(users, email, password);
  const id = findUser.id;
  if (!findUser) {
    // eslint-disable-next-line camelcase
    const user = users[session_user_id];
    const templateVars = {
      user,
      // eslint-disable-next-line camelcase
      err_msg: `Sorry the email : ${email} or password ${password} is not available`
    };
    return res.render("login", templateVars);
  }
  req.session["user_id"] = id;
  return res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let randoID = generateRandomString();
  let redirect = "urls";
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);
  if (validateEmail(email) && validatePassword(password)) {
    users[randoID] = {
      id: randoID,
      email,
      password
    };
    // eslint-disable-next-line camelcase
    req.session.user_id = randoID;
  } else {
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