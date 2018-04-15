const express = require('express');
const http = require('http');
const cors = require('cors');
const SocketIO = require('socket.io');

require('./connection.js');

const app = express();

let myDB = null;

app.use(cors());

app.use('/public', express.static('public'));

app.get('/', function(req,res){
  res.sendFile(__dirname + '/test.html');    // gửi file html lên máy
});

app.get('/googlemap',(req,res)=>{
	res.sendFile(__dirname+ '/googlemap.html');
});

app.get('/chart',(req,res)=>{
	res.sendFile(__dirname+ '/ChartJsTest.html');
});
// create a server for Socket.io
const server = http.Server(app);

// khởi tạo thư viện socket.io
const io = SocketIO(server);

io.on('connection',function(socket) {			// đoạn chương trình sẽ chạy khi có một kết nối đến server 
	console.log('socket connection');			// in ra màn hình để debug
	socket.on('customEvent',function(msg){				//nếu nhận một tin nhắm với mã là Nut1 thì sẽ xử lý tín hiệu msg
		socket.broadcast.emit('message','heloo arduino');
		console.log('ok web');
		var time = new Date().getTime();
		msg.time = time;
		// insert sample data to DB
		myDB.collection("status").insertOne(msg, function(err, res) { // kết nối vào collection customers và inser message từ website vào database
			if (!err) {
				console.log('inserted successfully!');
				//console.log(res);
			}
		});
	});
	socket.on('chartemit',function(msg){
		myDB.collection("status").find({}).toArray(function(err, result){  //lấy tất cả file trong collection customers
			if (!err) {
					var d1=[];
					for (i=0; i < result.length ;i++){
						d1.push(result[i].d1);
					}
					socket.emit('updateChartJs',d1);
			}
		});
	});

	socket.on('UpdateGGmap',function(msg){
		myDB.collection("customers").find({}).toArray(function(err, result){  //lấy tất cả file trong collection customers
			if (!err) {
				var kinh=[];
				var vi=[];
				for (i=0; i < result.length ;i++){
					
					kinh.push(result[i].GPS[0]);
					vi.push(result[i].GPS[1]);
					//console.log(kinh[i] + '  ' + vi[i]);
				}
				console.log({"Kinhdo": kinh,"vido": vi});
				socket.emit('updateGPS',{"kinhdo": kinh,"vido": vi})
			}
		});
		
	});
});


process.once('dbReady', () => {
	myDB = global.connection.db('mydb');
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server started on port 3000...');
	});
});
