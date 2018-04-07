#include <SocketIoClient.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ArduinoJson.h>
#include <stdio.h>
unsigned long int previousMillis;
unsigned long int interval = 1000;
// tên wifi và password nơi mà ESP cài đặt (ví dụ: nhà bạn)
const char* ssid = "Phong Dep SG 01..05";
const char* password = "88888888";

// host và post của SocketIO Server
char host[] = "192.168.0.106";
int port = 80;
int i,val;
char dis[5];
//char domain[] = "fast-anchorage-66763.herokuapp.com";
// char host[] = "hieuwebsite.herokuapp.com";

// Khởi tạo socket
SocketIoClient socket;

ESP8266WiFiMulti WiFiMulti;
// trên module ESP8266, chân của LED là 16
const int LED = 16;
void setupNetwork() {
    //Kết nối vào mạng Wifi
    WiFiMulti.addAP(ssid, password);
    //WiFi.disconnect();
    while(WiFiMulti.run() != WL_CONNECTED) {
        delay(500);
        Serial.print('.');
    }
    
    Serial.println("Wifi connected!");
    Serial.println(F("Di chi IP cua ESP8266 (Socket Client ESP8266): "));
    Serial.println(WiFi.localIP());
    
    // Kết nối đến SocketIO server
//    socket.begin(domain);
    socket.begin(host, port);
}
void JsonWrap(){
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["sensor"] = "gps";             // giả lập tên sensor là gps
  root["rpm"] = random(1000,10000);   // giả lập tốc độ rpm từ 1000-10000 rpm
  JsonArray& data = root.createNestedArray("data");
  data.add(48.756080);  // thêm 2 tọa độ vào Data
  data.add(2.302038);
  char Jsonstring[200];  // Tạo một chuỗi tên là Jsonstring
  root.printTo(Jsonstring); // lưu chuối Json vừa tạo vào chuỗi Jsonstring
  // đén bước này đã đóng gói thành công chuỗi JSON cần gửi
  socket.emit("customEvent",Jsonstring); // gửi lên server chuỗi Jsonstring với mã là customEvent
  root.prettyPrintTo(Serial);
};
void choptatLed(const char load[8],size_t length){
  digitalWrite(16,!digitalRead(16));
}

void setup() {
  pinMode(16, OUTPUT); // Cài đặt chân LED là chân đầu ra tín hiệu
    // Bắt đầu kết nối serial với tốc độ baud là 115200.
    // Khi mở serial monitor thì phải set đúng tốc độ baud.
    Serial.begin(115200);
    setupNetwork();
    socket.on("message",choptatLed );
    
}

void loop() {
  
    socket.loop();
   if (millis() - previousMillis > 5000) {
      JsonWrap(); // Cứ 5s thì gọi hàm JsonWrap một lần
       previousMillis = millis();
    };
}
