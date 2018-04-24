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

app.get('/liveUpdates',(req,res)=>{
	res.sendFile(__dirname+ '/liveUpdates.html');
});	
// create a server for Socket.io
const server = http.Server(app);

// khởi tạo thư viện socket.io
const io = SocketIO(server);

io.on('connection',function(socket) {			// đoạn chương trình sẽ chạy khi có một kết nối đến server 
	console.log('socket connection');			// in ra màn hình để debug
	socket.on('customEvent',function(msg){		// nhận tập tin customEvent từ ESP8266
		console.log('ok web');
		var time = new Date().getTime();		// tạo thêm hàm thời gian để đưa lên server
		msg.time = time;
		socket.broadcast.emit('liveUpdates',msg); // gửi tệp vừa đóng gói lên trang liveUpdates
		// insert sample data to DB
		myDB.collection("status").insertOne(msg, function(err, res) { // kết nối vào collection status và insert message từ website vào database
			if (!err) {
				console.log('inserted successfully!');
			}
		});
	});
	socket.on('chartemit',function(msg){		// xử lý khi nhận được tín hiệu chartemit 
		var timeFrom = new Date(2018,3,msg.from[0]  ,msg.from[1],msg.from[2],0,0).getTime(); // xử lý ngày tháng nhận được ra định dạng thời gian chuẩn
		var timeTo 	 = new Date(2018,3,msg.to[0],msg.to[1],msg.to[2],0,0).getTime();
		
		myDB.collection("status").find({ $and: [{time: {$gte : Number(timeFrom)}},{time: {$lte : Number(timeTo) } }]}).toArray(function(err, result){  //lấy tất cả dữ liệu nằm trong khoản thời gian cần tìm
					console.log(result[msg.sensor]);
					var dataEmit=[];
					for (i=0; i < result.length ;i++){			// lọc riêng dữ liệu của sensor đã request 
						dataEmit.push(result[i][msg.sensor]);
					} 
					socket.emit('updateChartJs',dataEmit); // emit gói updatechartJs với dữ liệu đã lọc
			}
		});
	});

	socket.on('UpdateGGmap',function(msg){  // xử lý khi nhận request từ trang googlemap
		var timeFrom = new Date(2018,3,msg.from[0]  ,msg.from[1],msg.from[2],0,0).getTime();
		var timeTo 	 = new Date(2018,3,msg.to[0] ,msg.to[1],msg.to[2],0,0).getTime();
		console.log([timeFrom,timeTo]);
		myDB.collection("status").find({ $and: [{time: {$gte : Number(timeFrom)}},{time: {$lte : Number(timeTo) } }]}).toArray(function(err, result){  //lấy tất cả file trong collection customers
			if (!err) {
				var kinh=[];
				var vi=[];
				for (i=0; i < result.length ;i++){
					
					kinh.push(result[i].GPS[0]);
					vi.push(result[i].GPS[1]);
				}
				//console.log({"Kinhdo": kinh,"vido": vi});
				socket.emit('updateGPS',{"kinhdo": kinh,"vido": vi})
			}
		});
		
	});
});


process.once('dbReady', () => {   // một khi đã kết nói với database mới khởi động server
	myDB = global.connection.db('prodata');
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server started on port 3000...');
	});
});
