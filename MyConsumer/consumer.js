//Requiered modules
const amp = require('amqplib');
const Influx = require('influx');
const io = require('socket.io-client');
var nodemailer = require('nodemailer');

//Initialize the mail settings
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'senderEmail@gmail.com',
        pass: 'senderPass'
    }
});
//Initialize the mail options
var mailOptions = {
    from: 'senderEmail@gmail.com',
    to: 'receiver@gmail.com',
    subject: 'Temperature Alert!!!',
    text: `The temperature text...`
};

//Initialize the connect to the server to the Attica region
var atticaRegionServer = io.connect("http://192.168.1.5:4000/atticaRegion");

//Trigger the "join_Temp_room" event to join in a room , at Attice region namespace
atticaRegionServer.emit("join_Temp_room", "temp_Values");

//Print the outcome from the join event
atticaRegionServer.on("success", (res) => {
    console.log(res)
})
atticaRegionServer.on("err", (err) => {
    console.log(err);
})


//Initialize the influxDB settings (no port option because i use the default one)
const influx = new Influx.InfluxDB({
    host: '192.168.1.5',
    database: 'values_from_sensor',
    schema: [{
        measurement: 'temp',
        fields: {
            value: Influx.FieldType.FLOAT
        },
        tags: [
            'sensor'
        ]
    }]
})

//RabbitMQ Settings initialization
const rabbitmqSettings = {
    protocol: 'amqp',
    hostname: '192.168.1.5',
    port: 5672,
    username: 'iotproject',
    password: 'iotproject',
    vhost: '/',
    authMechanism: ['PLAIN', 'AMQPLAIN', 'EXTERNAL']
}

//The main function (connect), implement all the functionality for the purpose of reading broker (tempValues) queue, process the data, write data into influxDB, alert the user and send the recieved data to external an external server...
async function connect() {

    const queue = 'tempValues'; //RabbitMQ queue name...
    const sensorName = 'TMP36GZ'; //The name of the sensor
    try {

        //apply the RabbitMQ settings to create a link between the consumer and the queue...
        const conn = await amp.connect(rabbitmqSettings);
        console.log("Connection Created...");

        const channel = await conn.createChannel();
        console.log("Channel Created...");

        const res = await channel.assertQueue(queue);
        console.log("Queue Created...");

        console.log(`Waiting for messages from ${queue}`);

        //Read the queue value
        channel.consume(queue, message => {
            let tempValue = JSON.parse(message.content.toString()); //Convert from JSON to javascript object
            console.log(`Received the temp value ${tempValue.temperature} from queue`);

            //Process only the temperature data
            if (tempValue.sensorName == sensorName) {

                //Delete the message from the queue
                channel.ack(message);
                console.log('Deleted message from queue...');

                //Write the data to influxDB
                influx.writePoints([{
                    measurement: 'temp',
                    tags: { sensor: tempValue.sensorName },
                    fields: { value: tempValue.temperature },
                }]).then(() => {
                    console.log("The write into influxDB was successful\n")
                })

                //Trigger the "handleData" event and send the data to the external server as JSON...
                atticaRegionServer.emit("handleData", JSON.stringify(tempValue));
            } else {
                console.log('This message is not for me...');
            }
        })
    } catch (error) {
        console.log(`Error => ${error}`);
    }

}

//Every 5mins process the influxDB data...
setInterval(function() {
    //Query the influxDB to take the values from the last five minutes...
    influx.query(`SELECT * FROM "temp" WHERE time >= now() - 5m`)
        .then(res => {
            var past5minsValues = [];

            //Pushing every row into an array
            res.forEach(row => {
                past5minsValues.push(row.value);
            })

            //Loop over the array and calculate the percentage Increase and percentage Decrease...
            for (let i = 1; i < past5minsValues.length; i++) {

                // %  Increase = (((New - Original)/ Original) * 100%)
                if ((((past5minsValues[i] - past5minsValues[i - 1]) / past5minsValues[i - 1]) * 100) >= 40) {
                    let percIncr = (((past5minsValues[i] - past5minsValues[i - 1]) / past5minsValues[i - 1]) * 100).toFixed(2);
                    mailOptions.text = `The temperature to Attica region increased by ${percIncr}%!`;

                    //Notify the user
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(`The temperature to Attica region increased by ${percIncr}%!\n`);
                        }
                    });
                    break;
                }

                //% Decrease = (((Original - New)/ Original) * 100%)
                if ((((past5minsValues[i - 1] - past5minsValues[i]) / past5minsValues[i - 1]) * 100) >= 40) {
                    let percDecr = (((past5minsValues[i - 1] - past5minsValues[i]) / past5minsValues[i - 1]) * 100).toFixed(2);
                    mailOptions.text = `The temperature to Attica region decrased by ${percDecr}%!`;

                    //Notify the user
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(`The temperature to Attica region decrased by ${percDecr}%!\n`);
                        }
                    });
                    break;
                }

            }
        });
}, 300000);

connect();