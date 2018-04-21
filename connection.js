const MongClient = require('mongodb').MongoClient;
const url = "mongodb://normally96:Hieucom5196@ds259105.mlab.com:59105/prodata";

MongClient.connect(url, (err, db) => {
  if (!err) {
    global.connection = db;
    console.log('DB connection ready!');
    process.emit('dbReady');
  } else {
    throw err;
  }
});
