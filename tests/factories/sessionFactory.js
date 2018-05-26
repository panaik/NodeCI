const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");
const keygrip = new Keygrip([keys.cookieKey]);

// we are going to pass in a user model with the intention of creating a session for that user
// so anytime we need to log into our application, we will call the User Factory to make a user
// take that user, and pass it in here to the Session Factory to create new session for that user
module.exports = user => {
  const sessionObject = {
    passport: {
      user: user._id.toString() // mongoose model _id prop is a JS object and not a string
    }
  };

  // get the base64 version of the sessionObject
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  const sig = keygrip.sign("session=" + session);

  // console.log(session, sig);

  return { session, sig };
};
