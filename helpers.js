const getUserByEmail = function(email, database) {
  let theUser;
  for (let user in database) {
    if (database[user].email === email) {
      theUser = database[user];
    }
  }
  return theUser;
};

module.exports = {getUserByEmail};