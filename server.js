const express = require('express'); // add express module
const http = require('http');       // add http module
const cors = require('cors');       // add cors module
const SocketIO = require('socket.io'); // add socket.io module
var net = require('net'); // add module net

var checkSocketIoConnected = false;

// tạo server TCP/IP
var tcpServer = net.createServer();

// hàm xử lý khi server nhận tệp tin từ GPRS module
tcpServer.on("connection", function(socket) {
    console.log("tcpServer connected");
    socket.on("data", function(msg) {

        // xử lý để chuyển tin nhắn vừa nhận thành chuỗi JSON
        var message = msg.toString();
        var messageObj = JSON.parse(message);
        messageObj.GPS[0]=Number(messageObj.GPS[0]);
        messageObj.GPS[1]=Number(messageObj.GPS[1]);
        console.log(messageObj);
        var time = new Date().getTime();
        messageObj.time = time;
        // gửi Object vừa đóng gói lên trang liveUpdates
        if(checkSocketIoConnected){
            global.socketIO.emit('liveUpdates', messageObj);
        } else {
            console.log("liveUpdates disconnected");
        }
        

        // kết nối vào collection status và insert message từ website vào database
        myDB.collection("status").insertOne(messageObj, function(err, res) {
            if (!err) {
                console.log('inserted successfully!');
            }
        });
    });
});

// tcp Server lắng nghe ở port 1334
tcpServer.listen(process.env.PORT || 1334, function() {
    console.log("tcpServer listen on 1334 port");
});

// khởi tạo kết nối đến database
require('./connection.js');

const app = express();

let myDB = null;

app.use(cors());

app.use('/public', express.static('public'));

// gửi file test.html khi có truy cập vào đường link ../
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/main.html');
});

// gửi file googlemap.html khi có truy cập vào đường link ../googlemap
app.get('/googlemap', (req, res) => {
    res.sendFile(__dirname + '/googlemap.html');
});

// gửi file CharJsTest.html khi có truy cập vào đường link ../chart
app.get('/chart', (req, res) => {
    res.sendFile(__dirname + '/ChartJsTest.html');
});

// gửi file liveUpdates.html khi có truy cập vào đường link ../liveUpdates
app.get('/liveUpdates', (req, res) => {
    res.sendFile(__dirname + '/liveUpdates.html');
});

// create a server for Socket.io
const server = http.Server(app);

// khởi tạo thư viện socket.io
const io = SocketIO(server);

// đoạn chương trình sẽ chạy khi có một kết nối đến server
io.on('connection', function(socket) {
    checkSocketIoConnected = true;
    global.socketIO = socket;
    console.log('socket connection');

    // nhận tập tin customEvent từ ESP8266	
    socket.on('customEvent', function(msg) {
        console.log('ok web');

        // tạo thêm hàm thời gian để đưa lên server
        var time = new Date().getTime();
        msg.time = time;

        // gửi tệp vừa đóng gói lên trang liveUpdates
        socket.broadcast.emit('liveUpdates', msg);

        // sao chép vào database
        myDB.collection("status").insertOne(msg, function(err, res) { // kết nối vào collection status và insert message từ website vào database
            if (!err) {
                console.log('inserted successfully!');
            }
        });
    });

    // xử lý khi nhận được tín hiệu chartemit 
    socket.on('chartemit', function(msg) {

        // xử lý ngày tháng nhận được ra định dạng thời gian chuẩn
        var timeFrom = msg.from;
        var timeTo = msg.to;

        // tìm data theo thời gian vừa xử lý
        myDB.collection("status").find({
            $and: [{
                time: {
                    $gte: Number(timeFrom)
                }
            }, {
                time: {
                    $lte: Number(timeTo)
                }
            }]
        }).toArray(function(err, result) { //lấy tất cả dữ liệu nằm trong khoản thời gian cần tìm
            var dataEmit = [];

            // lọc riêng dữ liệu của sensor đã request 
            for (i = 0; i < result.length; i++) {
                dataEmit.push(result[i][msg.sensor]);
            }

            // emit gói updatechartJs với dữ liệu đã lọc
            socket.emit('updateChartJs', dataEmit);

        });
    });

    // xử lý khi nhận request từ trang googlemap
    socket.on('UpdateGGmap', function(msg) {

        // xử lý ngày tháng nhận được ra định dạng thời gian chuẩn
        var timeFrom = msg.from;
        var timeTo = msg.to;

        // tìm data theo thời gian vừa xử lý
        myDB.collection("status").find({
            $and: [{
                time: {
                    $gte: Number(timeFrom)
                }
            }, {
                time: {
                    $lte: Number(timeTo)
                }
            }]
        }).toArray(function(err, result) { //lấy tất cả file trong collection customers
            if (!err) {
                var kinh = [];
                var vi = [];
                for (i = 0; i < result.length; i++) {

                    kinh.push(result[i].GPS[0]);
                    vi.push(result[i].GPS[1]);
                }

                socket.emit('updateGPS', {
                    "kinhdo": kinh,
                    "vido": vi
                })
            }
        });

    });
});

// một khi đã kết nói với database mới khởi động server
process.once('dbReady', () => {
    myDB = global.connection.db('prodata');
    server.listen(process.env.PORT || 1333, () => {
        console.log('Server started on port 1333...');
    });
});