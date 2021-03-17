//Requiered modules
const amp = require('amqplib');
const serialPort = require('serialport');

//Serial port initialization
var port = new serialPort('/dev/ttyUSB0', { baudRate: 9600, });

//RabbitMQ Settings initialization
const rabbitmqSettings = {
    protocol: 'amqp',
    hostname: 'localhost',
    port: 5672,
    username: 'iotproject',
    password: 'iotproject',
    vhost: '/',
    authMechanism: ['PLAIN', 'AMQPLAIN', 'EXTERNAL']
}

//The main function (connect), implement all the functionality for the purpose of reading the serial port and send the data to the broker (tempValues) queue... 
async function connect() {

    const queue = 'tempValues'; //RabbitMQ queue name...

    try {

        //apply the RabbitMQ settings to create a link between the producer and the queue...
        const conn = await amp.connect(rabbitmqSettings);
        console.log("Connection Created...");

        const channel = await conn.createChannel();
        console.log("Channel Created...");

        let res = await channel.assertQueue(queue);
        console.log("Queue Created...");


        //read the data from the serial port...
        const Readline = serialPort.parsers.Readline;
        const parser = new Readline();
        port.pipe(parser);

        port.on('open', function() {
            console.log('port open...');
        });

        //create an empty object and fill it with the sensor name and the temp value...
        parser.on('data', function(data) {
            var tempValueObj = new Object();
            tempValueObj.sensorName = "TMP36GZ";
            tempValueObj.temperature = data.slice(0, -2);

            //convert the object to JSON (requiered from the RabbitMQ broker)
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(tempValueObj)));
            console.log(`Message sent to queue ${queue}`);
        });
        port.on('close', function() {
            console.log('port closed');
        });
        port.on('error', function() {
            console.log('something went wrong in serial communication');
        });

    } catch (error) {
        console.log(`Error => ${error}`);
    }
}

connect();