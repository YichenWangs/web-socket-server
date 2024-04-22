/**
 * Library for running websocket server and clients.
 */
const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');

const uuid = require('uuid');  
const { timeStamp, log } = require('console');

const fs = require('fs');
const inquirer = require('inquirer');

const port = 3000;
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });
const sockets = {};

/**
 * A bunch of ip addresses handling devices in Yichen's collaborative AR study.
 */
const HL19_ip = "::ffff:192.168.0.172";
const HL21_ip = "::ffff:192.168.0.253";
const HL35_ip = "::ffff:192.168.0.50";
const HL36_ip = "::ffff:192.168.0.48";
const minilab1 = "::ffff:192.168.0.132";
const minilab2 = "::ffff:192.168.0.81";
const ethernet1 = "::ffff:192.168.0.19";
const ethernet2 = "::ffff:192.168.0.248";
const ethernet3 = "::ffff:192.168.0.249";
const charles_ai = "::ffff:192.168.0.81:5001";

var laptop1 = minilab1;
var laptop2 = minilab2; 
var hl1 = ethernet2;
var hl2 = ethernet3;
var hl3 = ethernet1;
var hl4 = ethernet2;

const configured_control_nums_ai = [74, 71, 76, 77, 93, 18, 19, 16];
const const_control_num_range = [[0, 1], [0, 1], [0, 1], [0, 1], [0,100],[0,100], [ -70, 12], [-70, 12]];

/**
 * Handy variables handling small things.
 */
var filename;
var exp_con;

var genai_data;



/**
 * Websocket Client that connects to charles genai_midi_module.
 */
const genai_ws = new WebSocket('ws://localhost:5001');

genai_ws.on('open', function open() {
  console.log("Connection to charles's genAI server is open.");
  // Useless prompt message.
  genai_ws.send('/channel/0/noteoff/0/0');
});


genai_ws.on('message', function message(data) {
  // console.log('Received from the AI agent: %s', data);
  parse_data = data.replace("cc", "controlchange");
  // route_data = convertToInterface(parse_data);
  // genai_data = parse_data;
  // Broadcast to hololens --- todo: does this work?

    // testing AI to musician.
    // to(minilab1, genai_data);
    // to(hl3, genai_data);
    // to(hl4, genai_data);



});

genai_ws.on('error', function error(data) {
  console.log("Websocket error:" + data.code);
  genai_ws.close();
  
});
genai_ws.on('close', function close(data) {
  console.log("The connection is closed.")
  console.log("Error information" + data);
  // setTimeout(() => {
  // }, 5000);
});



// sockets[genai_ws.id] = genai_ws; // add to the list of socket

// genai_ws.on('message', route_message); // could do it this way so that

// }


const questions = [
  {
    type: 'input',
    name: 'filename',
    message: "What's the filename for log?",
  },
  {
    type: 'input',
    name: 'expcon',
    message: "What's the current experiment condition?",
  },
];

inquirer.prompt(questions).then(answers => {
  filename = answers.filename;
  console.log(answers.filename);
  exp_con = answers.expcon;
  console.log(answers.expcon);


});


/**
 * Directing to difference devices vis ip address + musical instrument data.
 * @param {*} user 
 * @param {*} data 
 */
// thanks to https://stackoverflow.com/questions/51316727/how-do-i-send-a-message-to-a-specific-user-in-ws-library.
function to(user, data) {
    if(sockets[user] && sockets[user].readyState === WebSocket.OPEN)
        sockets[user].send(data);
}

/**
 * Websocket Server on connection.
 */
wss.on('connection', function(ws, request, client) {
  console.log("Client joined.");
  const user_id = request.socket.remoteAddress;
  ws.id = user_id;
  sockets[ws.id] = ws;
  // console.log(sockets);

  // //create new file
  // fs.open(filename, 'w', function (err, file) {
  //   if (err) throw err;
  //   console.log('File created!');
  // }); 



  ws.on('error', function error (err){
    console.log(err.code);
    ws.close();

  });


  ws.on('message', function message (data) {
    console.log("Received from %s with musical data: %s ", user_id, data);
    
    const msg_array = data.split("/");
    //console.log(msg_array)
    const channel_num = msg_array[2];
    const msg_type = msg_array[3];
    const control_num = msg_array[4];
    const control_num_int = parseInt(control_num);
    
    //console.log(msg_type)

    // Handling data send to AI agent.
    if (msg_type == "cc" && configured_control_nums_ai.includes(control_num_int)){
      console.log("Sending to GenAI");
      genai_ws.send(data);
    }else if ((msg_type == "noteon" || msg_type == "noteoff") && (channel_num == 1)) {
      genai_ws.send(data);
    }    

      parse_data = data.replace("cc", "controlchange");
      //sroute_data = convertToInterface(parse_data);
      to(hl4, parse_data);
      to("::ffff:192.168.0.216", parse_data);
    // Handling data send to human musicians.  --- for group study
    // if (user_id == laptop1 ) {
    //       to(hl4, data);
    // }else if (user_id == laptop2) {
    //       to(hl3, data);
    // }



    // For previous AR study.
    // if (fs == null) {
    //   fs.open(filename, 'w', function (err, file) {
    //     if (err) throw err;
    //     console.log('Open File!');
    //   }); 
    // }
    // if (exp_con == "rmi") {
    //       //RMI condition
    //   if (user_id == laptop1 ) {
    //         to(hl4, data)
    //   }else if (user_id == laptop2) {
    //         to(hl3, data)
    //   }
    
    // }else if (exp_con == "bmi") {
    //       //BMI condition
    // if (user_id == hl3) {
    //   to(hl4, data)
    // }else if (user_id == hl4) {
    //   to(hl3, data)
    // }
    // }else if (exp_con == "localtest"){
    //   to("::ffff:127.0.0.1", data)
    // }else if (exp_con == "hltest"){
    //   to(hl3, data)
    // }else if (exp_con == "dostest"){
    //   to("::ffff:192.168.0.216" ,data)
    // }else if  (exp_con == "duplex"){
    //   if (user_id == laptop1) {
    //   to(hl4, data)
    //   }else if (user_id == laptop2) {
    //   to(hl3, data)
    //   }
    //   if (user_id == hl4) {
    //     to(hl3, data)
    //   }else if (user_id == hl3) {
    //     to(hl4, data)
    //   }
    // }

  });

  ws.on('close', function() {
    console.log("client left.");
  });
});


server.listen(port, function() {
   console.log(`Listening on http://localhost:${port}`);
});

function convertToInterface(data) {
  console.log(data);
  route_data = data
  const msg_array = data.split("/");
  //console.log(msg_array)
  const channel_num = msg_array[2];
  const msg_type = msg_array[3];
  const control_num = msg_array[4];
  const control_num_int = parseInt(control_num);
if (msg_type == "controlchange") {
    //spliting the data and adapt to controlchange value on the interface
    control_value_int = parseInt(msg_array[5]);
    adapt_value_range = const_control_num_range[configured_control_nums_ai.indexOf(control_num_int)]
    adapt_value =  control_value_int/127 * (adapt_value_range[1] - adapt_value_range[0]) + adapt_value_range[0];
    route_data = "/channel/" + channel_num + "/" + msg_type + "/" + control_num + "/" + adapt_value.toFixed(2);
  
    console.log(route_data);
}
  return route_data;

}