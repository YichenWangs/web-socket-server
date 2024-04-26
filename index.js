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
const sockets_port = {};

/**
 * A bunch of ip addresses handling devices in Yichen's collaborative AR study.
 */
const HL19_ip = "::ffff:192.168.0.172";
const HL21_ip = "::ffff:192.168.0.253";
const HL35_ip = "::ffff:192.168.0.50";
const HL36_ip = "::ffff:192.168.0.48";
const minilab2 = "::ffff:192.168.0.132";
const minilab1 = "::ffff:192.168.0.81";
const ethernet1 = "::ffff:192.168.0.19";
const ethernet2 = "::ffff:192.168.0.248";
const ethernet3 = "::ffff:192.168.0.249";
const charles_ai = "::ffff:127.0.0.1";

var laptop1 = minilab1;
var laptop2 = minilab2;
var hl1 = ethernet2;
var hl2 = ethernet3;
var hl3 = ethernet1;
var hl4 = ethernet2;



const configured_control_nums_ai = [74, 71, 76, 77, 93, 18, 19, 16];
const const_control_num_range = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 100], [0, 100], [-70, 12], [-70, 12]];

/**
 * Handy variables handling small things.
 */
var filename;
var exp_con;

const questions = [
  // {
  //   type: 'input',
  //   name: 'filename',
  //   message: "What's the filename for log?",
  // },
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

  if (sockets[user] && sockets[user].readyState === WebSocket.OPEN) {
    sockets[user].port = sockets_port[user];
    sockets[user].send(data);
    //console.log("Sending data to connection" + user + ":" + sockets[user].port ) ;
  }
}

/**
 * Websocket Server on connection.
 */
wss.on('connection', function (ws, request, client) {
  console.log("Client joined.");
  const remote_address = request.socket.remoteAddress;
  const remote_port = request.socket.remotePort;
  const user_id = `${remote_address}`;
  ws.id = user_id;
  sockets[ws.id] = ws;
  sockets_port[ws.id] = remote_port;
  // console.log(request.socket.remoteAddress);
  // console.log(request.socket.remotePort);
  // console.log(request.socket.remoteFamily);
  console.log("current connection id is " + user_id);
  // //create new file
  // fs.open(filename, 'w', function (err, file) {
  //   if (err) throw err;
  //   console.log('File created!');
  // }); 

  ws.on('error', function error(err) {
    console.log(err.code);
    ws.close();

  });

  ws.on('message', function message(data) {
    //console.log("Received from %s with musical data: %s ", user_id, data);
    const msg_array = data.split("/");
    const tag = msg_array[msg_array.length - 1];
    const channel_num = msg_array[2];
    const msg_type = msg_array[3];
    const control_num = msg_array[4];
    const control_num_int = parseInt(control_num);

    var route_data_from_human_to_ai = "";
    var route_data_from_human_to_human = data;
    var route_data_from_ai_to_human = data;
    var temp_tag_off = "";

    for (let i = 0; i < msg_array.length - 1; i++) {
      temp_tag_off += msg_array[i] + "/";
    }

    // message comes from ai
    if (tag == "ai") {

      // Handling data from AI agent sending to human musician Hololens.
      //console.log("AI - Human:" + route_data_from_ai_to_human);
      to("::ffff:192.168.0.216", route_data_from_ai_to_human);
      to(hl3, route_data_from_ai_to_human);
      to(hl4, route_data_from_ai_to_human);


      // message comes from human 
    } else if (tag == "human") {
      // Handling data from human musician on keoboard sending to AI agent - change controlchange to cc
      // and to human musician Hololens.
      route_data_from_human_to_ai = temp_tag_off;

      //to(laptop1, route_data_from_human_to_ai);
      if (msg_type == "controlchange" && configured_control_nums_ai.includes(control_num_int)) {
        route_data_from_human_to_ai = route_data_from_human_to_ai.replace("controlchange", "cc");
        console.log("Human - AI controlchange" + route_data_from_human_to_ai);
        //genai_ws.send(route_data_from_human_to_ai);
        to(charles_ai, route_data_from_human_to_ai);
      } else if ((msg_type == "noteon" || msg_type == "noteoff") && (channel_num == 1)) {
        console.log("Human - AI note" + route_data_from_human_to_ai);
        //genai_ws.send(route_data_from_human_to_ai);
        to(charles_ai, route_data_from_human_to_ai);
      }
      //console.log("Human - Human" + route_data_from_human_to_human);
      to("::ffff:192.168.0.216", route_data_from_human_to_human);
      if (exp_con = "group") {
        // send to each other
        if (user_id == laptop1) {
          to(hl3, route_data_from_human_to_human);
        } else if (user_id == laptop2) {
          to(hl4, route_data_from_human_to_human);
        }
      }
    }

    //var route_data_from_human_to_human = data + "/human";
    //console.log(route_data_from_human_to_ai)
    // console.log(route_data_from_human_to_human)  

    // for testing in Unity
    // var parse_data = data.replace("cc", "controlchange");
    // to(hl4, parse_data);
    // testing sending human musician information


  });

  ws.on('close', function () {
    console.log("client left.");
  });
});


server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});
