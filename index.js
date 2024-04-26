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

/**
 * Handy variables handling small things.
 */
var filename;
var exp_con;



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


const notes_map =  [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C5" ];
  ws.on('error', function error (err){
    console.log(err.code);
    ws.close();

  });

  ws.on('message', function message (data) {
    console.log("Received from %s with musical data: %s ", user_id, data);
    console.log(data);
    var msg = data.split('/');
    var note = msg[1];

    var idx = notes_map.indexOf(note);  
    console.log(note);
    var midi = 60 + idx;

    console.log(midi);

  });

  ws.on('close', function() {
    console.log("client left.");
  });
});


server.listen(port, function() {
   console.log(`Listening on http://localhost:${port}`);
});

