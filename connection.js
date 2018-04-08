const MongClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

MongClient.connect(url, (err, db) => {
  if (!err) {
    global.connection = db;
    console.log('DB connection ready!');
    process.emit('dbReady');
  } else {
    throw err;
  }
});
