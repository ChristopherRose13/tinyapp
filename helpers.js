




//validates that a password is good for signup
const validatePassword = function(password) {
  return !!password;
};

//returns true if the email exists
const findEmail = (users, email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};



//generates a random id for the url
const generateRandomString = function() {
  let randomString = Math.random().toString(36).slice(2);
  randomString = randomString.slice(0,6);
  return randomString;
};

//fetches urls for the user
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

module.exports = {validatePassword, findEmail, generateRandomString, fetchUserUrls};