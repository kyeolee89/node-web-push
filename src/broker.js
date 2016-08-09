var redis = require('redis');

module.exports.run = function (broker) {
  var brokerOptions = broker.options.brokerOptions;
  var instanceId = broker.instanceId;

  var subClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);
  var pubClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);

  broker.on('subscribe', subClient.subscribe.bind(subClient));
  broker.on('unsubscribe', subClient.unsubscribe.bind(subClient));
  broker.on('publish', function (channel, data) {
    if (data instanceof Object) {
      try {
        data = '/o:' + JSON.stringify(data);
      } catch (e) {
        data = '/s:' + data;
      }
    } else {
      data = '/s:' + data;
    }

    if (instanceId != null) {
      data = instanceId + data;
    }

    pubClient.publish(channel, data);
  });

  var instanceIdRegex = /^[^\/]*\//;

  subClient.on('message', function (channel, message) {
    var data = '';
    var user_no = '';
    if(channel == 'redis_channel') {
      data = JSON.parse(message)[1];
      user_no = data.userNo.toString();
    } else {
      data = JSON.parse(message);
      user_no = data.recive_user_no;
    }

    var sender = null;
    message = message.replace(instanceIdRegex, function (match) {
      sender = match.slice(0, -1);
      return '';
    });

    // Do not publish if this message was published by
    // the current SC instance since it has already been
    // handled internally
    if (sender == null || sender != instanceId) {
      broker.publish(user_no, data);
    }
  });

  subClient.subscribe('redis_channel');
  subClient.subscribe('redis_channel2');
};