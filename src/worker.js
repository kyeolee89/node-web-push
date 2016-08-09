var fs = require('fs');
var express = require('express');
var path = require('path');
var request = require('ajax-request');
var https = require('https');
var redis = require('redis')

module.exports.run = function (worker) {
  var workerOptions = worker.options.workerOptions;

  console.log('   >> ['+workerOptions.serverType+'] Worker PID:', process.pid);
  /* 접속자 통계를 위한 redis 세팅 */
  var redisClient = redis.createClient(workerOptions.port, workerOptions.host, workerOptions);

  var app = require('express')();
  var httpServer = worker.httpServer;
  var scServer = worker.scServer;

  httpServer.on('request', app);

  /*
    In here we handle our incoming realtime connections and listen for events.
  */
  scServer.on('connection', function (socket) {
    var param = socket.socket.upgradeReq.url;
    var auth_key = param.substring(param.indexOf('authKey=')+8, param.indexOf('&userAgent'));
    var user_agent = param.substring(param.indexOf('&userAgent')+11, param.length-1);
    var user_no = '';

    var req = https.request({
      path: 'auth_check_url',
      method: 'POST',
      host: workerOptions.apiHost
    }, function(res) {
      res.on('data', function(data) {
        var resObj = JSON.parse(data);
        var flag = resObj.colData.flag.valueOf();
        user_no = resObj.colData.user_no.valueOf();

        if("success" !== flag) {
          socket.disconnect();
        } else {
          //console.log(resObj.colData.user_no)
          redisClient.srem("redis_smember_key", user_no);
          redisClient.sadd("redis_smember_key", user_no, function(err,data) {
            redisClient.expire("redis_smember_key", 60*60*24*365);
          });

        }
      });
    });

    socket.on('disconnect', function (socket) {
      redisClient.srem("redis_smember_key", user_no);
    });

    req.end();
  });

  scServer.on('disconnect', function(socket) {
    console.log(socket)
  })
  scServer.on('disconnect', function() {
    console.log('disconnect')
  })
};