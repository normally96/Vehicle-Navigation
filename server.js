const express = require('express');
const http = require('http');

let app = express();

app.use('/public', express.static('public'));
app.get('/', function(req,res){
  res.sendFile(__dirname + '/ChartJsTest.html');    // gửi file html lên máy
});
 var cors = require('cors');
 app.use(cors());
let server = http.Server(app);
server.listen(process.env.PORT || 80, function(){
  console.log("socket server connected...")
});

let io = require('socket.io')(server);       // khởi tạo thư viện socket.io

io.on('connection',function(socket){			// đoạn chương trình sẽ chạy khi có một kết nối đến server 
	console.log('socket connection');			// in ra màn hình để debug
	socket.on('customEvent',function(msg){				//nếu nhận một tin nhắm với mã là Nut1 thì sẽ xử lý tín hiệu msg
		socket.broadcast.emit('message','heloo arduino');
		console.log('ok web');
		MongoClient.connect(url, function(err, db) {			// hàm connect trực tiếp với database
 		 if (err) throw err;
  		var dbo = db.db("mydb"); 								//
  			//var myobj = { name: "Company Inc", address: "Highway 38" };
  			dbo.collection("customers").insertOne(msg, function(err, res) { // kết nối vào collection customers và inser message từ website vào database
    		if (err) throw err;
    		console.log("1 document inserted");
    		db.close();
  			});
		});
	});

	socket.on('rpm',function(msg){
		MongoClient.connect(url, function(err, db) {
 		 if (err) throw err;
  		var dbo = db.db("mydb");
  		dbo.collection("customers").find({}).toArray(function(err, result){
   		 if (err) throw err;
   		 console.log(result);
  		  db.close();
  			});
}		);
		console.log('ok rpm');
	});
})

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

