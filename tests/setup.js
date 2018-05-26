jest.setTimeout(30000);
// duration in ms, to tell Jest how long it should wait before failing a test

require("../models/User");

const mongoose = require("mongoose");
const keys = require("../config/keys");

mongoose.Promise = global.Promise; // tell Mongoose to use the NodeJS global Promise object and not its own
mongoose.connect(keys.mongoURI, { useMongoClient: true });
