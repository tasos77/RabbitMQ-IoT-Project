
 
# Project for IoT
![](https://i.ibb.co/TPb5Kqq/IMG-20210119-164759.jpg)

This project implement a communication method publish/subscribe using [**RabbitMQ Broker**](https://www.rabbitmq.com/).
This implement adds functions as, write of the values receipt to a database in order to represent and to send these same values to a remote server for further procedure.
## Architecture
This architecture is divided into 5 big parts :

1) The producer who produce and send the values to the broker.

2) The [**RabbitMQ broker**](https://www.rabbitmq.com/) which stores temporarily the values sent by the producer.

3) The consumer which consumes the stored values from the broker.

4) The database and the monitoring tool, into which the values stored and projected.

5) The remote server where the values sent for further procedure.


In particular this architecture is the following:

![Architecture](https://i.ibb.co/GWT976v/My-Archit-Final.png)
## Components

 - Arduino Uno
 - TMP36Gz temp sensor
 - Raspberry Pi 3
 - Desktop PC with Docker

# Project Setup

 - Download the repository from the website of swarmlab [link](https://git.swarmlab.io:3000/PurpleRose/RabbitMQ_IoT_Project). Thus, we have handy 5 folders, one per piece we have to setup.

## Αrduino
Beginning with Arduino, we have to connect it with our computer and the connecting platform Arduino IDE (if not present download and install it)    [link](https://www.arduino.cc/en/software) in order to insatll the code in the file **readTempValuesFromArduino.ino** of Arduino.

![enter image description here](https://i.ibb.co/nk8Fwd5/arduinofinal.png)

Possible issue in the code transfer to Arduino:

    [can't open device "/dev/ttyUSB0": Perm. denied (Linux permissions)]
Solution:
Open the terminal of the system and type:

    sudo chmod ugo+w /dev/ttyUSB0

> The same command must be run to the raspberry upon we 
> connect to Αrduino.

#### Sensor's Connection to Arduino
As shown in the architecture's picture above, the sensor includes three (3) connections **(Vcc, Gnd, Values).**
We connect the middle connector to the sensor with the analog input **Α0 (as shown in the code)** 
for receiving its values, the left connector to the **Current (Vcc)** and the right connector to the **Ground (Gnd)**.
**(1)** Based on the code of Arduino we are able to use the **pin** for the sensor's values from **Α0** in any analog connection and we change the **pin** in the code also.
**(2)** Also, we are able to change the value to the function **delay** in order of the quicker or slower sample receipt.
**(3)** Click the button to **compile**. In the case which no errors occured...
**(4)** Click the button to **upload** to Arduino.




## Raspberry
### Producer
Follow the steps concerning Raspberry [here](http://docs.swarmlab.io/SwarmLab-HowTos/labs/IoT/SensorNode2Server.adoc.html) in order to gain access.

![enter image description here](https://i.ibb.co/Pm3ggFT/rasfinal.png)
Upon we are in the system we transfer the downloaded files from the **repository** in the folder **MyProducer** (producer.js, package.json).
Then, run the command:

    npm install
To download all the dependencies needed to the script producer.js to run normally.
Finally, run the command:

    sudo chmod ugo+w /dev/ttyUSB0
In order Arduino to send the data through the serial connection.
If not present the **ttyUSB0** connection then run:

    ls /dev/tty*
To detect all Raspberry connections and into which Arduino is connected.
Repeat the change mode command (chmod) with the appropriate connection.

## Docker
For working the rest of the services need to install **Docker** and the **Docker Compose** to the local computer. [link](https://www.docker.com/).

### Consumer
In the folder MyConsumer open a terminal computer.
Then, run the command:

    docker build -t myconsumer .
This command will create a **docker image** with the info needed to run the script consumer.js.
Then, run the command:

    docker run -it -p 5673:5673 myconsumer
To compose a **container** from the **image** for the **consumer** service. 

> As shown in the command **run** we **expose** the port
> **5673** from the computer to the port **5673** of the **container**.

Finally, we check if the container run using the command:

    docker ps

### Server
We use the same proceduce for the **server**.
We go to the folder MyServer upon we startup a terminal.
Then, we run the command:

    docker build -t atticaregionserver .
    
    
This particular command will create a **docker image** with the info needed to run the script server.js.
Then, we run the command:

    docker run -it -p 4000:4000 atticaregionserver
To compose a **container** from the **image** for the **server** service. 
> As shown in the command **run** we **expose** the port
> **4000** from the computer to the port **4000** of the **container**.

Finally, we check if the container run using the command:

    docker ps
### RabbitMQ
The next needed service is **RabbitMQ broker**(AMQP). 
Of its functions **RabbitMQ** (fanout, token routing, etc) we will use the **Direct exchange**.

![enter image description here](https://i.ibb.co/RYp1v6D/rabbitmq-AMQP1.png)

At the beginning, we have to download the preset **RabbitMQ** image from the **docker hub** to run the command:

    docker run -d -p 15672:15672 -p 5672:5672 --name rabbitmq rabbitmq:3-management

The docker will download the **image** and will run it to **expose** the ports (**default ports**).

> The port **15672** is using from the **manager** and the port **5672** is using
> for the **broker**.

Then, we go to the port of the manager(localhost:15672) for further adjustments.
Upon info requst, we type **guest** as **username** and **password**. 
Then we have access of the **manager**.

![enter image description here](https://i.ibb.co/mDythTw/rabmenu2.png)

Now, we are able to **overview** the process of **produce** and **consume** using the graphs, the speed of **consume** and **produce** to the **tab Queues** , the **connection** and the **channels**.
Further, we are able to create a new user to the **tab Admin**.

### Grafana & InfluxDB
At this point, except of the **images** of **Grafana** and of **InfluxDB** we will need a **network** in order **Grafana** to automatically detect the database.
The structure we will use to obtain it is the following:

![enter image description here](https://i.ibb.co/Q6KJJLg/grafarchi.png)
To obtain the structure above we create a docker network with the command:

    docker network create influxDB_Grafana_network
To detect the available networks we use the command:

    docker network ls
Also, two **volumes** will be needed to avoid data lose of the **database** and of **Grafana** everytime which the **containers** close.
We create those two volumes using the following commands:

    docker volume create grafana_volume
    docker volume create influxdb_volume
To detect the available volumes we use the command:

    docker volume ls
    
The next step is to go to the folder **InfluxDB&Grafana compose** to run the command:

    docker-compose up -d
This command will create the content of the docker-compose.yml file.

![enter image description here](https://i.ibb.co/zS9x4rf/ymlfinal.png)
As shown to the file above with the **yml file** compose two **containers(InfluxDB,Grafana)** for using the common network **bridge network** and the corresponding **volumes**.

Upon composing the containers using the command:

    docker exec -it influxdb_container sh
We are able to access the **shell** in the container of the **InfluxDB**.
Then, we type **influx** to go to **shell** of the **InfluxDB**.
![enter image description here](https://i.ibb.co/61xPTQt/influxshell1.png)
The, we create our database with the command:

    create database values_from_sensor
Now, we are able to see the database we already create, with the command:

    show databases
#### Grafana (setup)
The next step is to go to the application of **Granafa** which run at the port **3000**.
We type to our **browser** the address **localhost:3000**.
The initial info for username and password are both **admin**.

Now, we have to set the **data source**, which in our case is **InfluxDB**.

![enter image description here](https://i.ibb.co/0cmwJzK/grafanadatasource1.png)

![enter image description here](https://i.ibb.co/MZ09yfV/grafanadatasource3.png)

![enter image description here](https://i.ibb.co/3M068dC/grafan2.png)

**Fill the database info:**

![enter image description here](https://i.ibb.co/xfynVnS/grafan4.png)

Then, we click **Save and Test**

**Dashboard Creation**

![enter image description here](https://i.ibb.co/JRF446y/dashboard.png)

![enter image description here](https://i.ibb.co/tbpJny1/dash2.png)

Choose the **data source** we already create and then the **measurement** we wish to project.

More adjustments for better presentation of the values of the **tab Panel** at the right of the screen.

![enter image description here](https://i.ibb.co/1JZttxt/sidedash11.png)

![enter image description here](https://i.ibb.co/rmPFVDL/sidedash22.png)

![enter image description here](https://i.ibb.co/YhKTNm5/sidedash33.png)


### Namespaces & rooms

![enter image description here](https://i.ibb.co/ygfjGrz/namespace-room.png)

# Indicative Project Run

## Waiting for producer's data
![enter image description here](https://i.ibb.co/d7JBPh3/final.png)
## Temperature rise above of 40%
![enter image description here](https://i.ibb.co/vPWrVy1/final5.png)
## User's Notification
![enter image description here](https://i.ibb.co/KztMBC4/139796416-225410489050033-1753819101017820134-n.jpg)

# Sources
https://git.swarmlab.io:3000/zeus/iot-swarm-example/raw/branch/master/docs/README.adoc#_server_site

http://docs.swarmlab.io/SwarmLab-HowTos/labs/IoT/SensorNode2Server.adoc.html

https://www.influxdata.com/blog/getting-started-with-node-influx/

https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html

https://node-influx.github.io/class/src/index.js~InfluxDB.html

https://www.thedevstop.com/metric-visualization-with-node-influxdb-and-grafana/

https://github.com/vicanso/influxdb-nodejs

https://www.w3schools.com/nodejs/nodejs_email.asp

https://docs.influxdata.com/influxdb/v1.8/query_language/explore-data/

https://github.com/influxdata/influxdb/issues/4209

