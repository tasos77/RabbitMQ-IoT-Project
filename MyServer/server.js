 //Required modules
 const express = require('express');
 const fs = require('fs');

 //App setup

 //creating an instance of express server
 const app = express();

 //server port
 const port = 4000;

 //http.createServer() method turns your computer into an HTTP server.
 const http = require('http').createServer();

 //(http.Server) the server bind to...
 const io = require('socket.io')(http);

 //my rooms
 const measurementRooms = ["temp_Values", "humidity_Values", "airspeed_Values"];

 //Server listen to...
 http.listen(port, () => {
     console.log("Server is listening on localhost: " + port);
 });

 //Waitting for connections...
 io.of("/atticaRegion").on("connection", (socket) => {

     //Trigger the "join_Temp_room" event to join a room
     socket.on("join_Temp_room", (room) => {

         //Checking the room integrity..
         if (measurementRooms.includes(room)) {
             socket.join(room);
             return socket.emit("success", "You have successfuly joined this room!\n");
         } else {
             return socket.emit("err", "Error:No room named " + room);
         }
     });

     //Trigger the "handleData" event to manipulate the recieved data
     socket.on("handleData", (data) => {

         //Convert from JSON to javascript object
         var sensordata = JSON.parse(data);
         console.log(`The sensor ${sensordata.sensorName} sends the value ${sensordata.temperature}`);

         //Append the recieved data into a .txt file...
         fs.appendFile('tempValues.txt', `Sensor name: ${sensordata.sensorName}, Sensor value:${sensordata.temperature}\n`, function(err) {
             if (err) return console.log(err);
             console.log('Success write to file tempValues.txt\n');
         });
     })
 });