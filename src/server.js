var SocketCluster = require('socketcluster').SocketCluster;
var numCpus = require('os').cpus().length;
var myArgs = process.argv.slice(2);
var serverType = myArgs[0];
var redisHost = '';
var redisPort = '';
var apiHost = '';
/* redis port, host 설정 */
if('dev' === serverType || 'local' === serverType) {
  redisHost = 'redis_host';
  redisPort = 5379;
  apiHost = 'api_host';
} else {
  redisHost = 'redis_host';
  redisPort = 6379;
  apiHost = 'api_host';
}

if(['local', 'dev', 'live'].indexOf(serverType) > -1) {
  var socketCluster = new SocketCluster({
    workers: numCpus,
    brokers: numCpus,
    port: 9191,
    secure:true,
    appName: 'sc1',
    workerController: __dirname + '/worker.js',
    brokerController: __dirname + '/broker.js',
    socketChannelLimit: 1000,
    crashWorkerOnError: true,
    brokerOptions: {
      host: redisHost,
      port: redisPort,
      serverType: serverType,
      apiHost: apiHost
    },
    workerOptions: {
      host: redisHost,
      port: redisPort,
      serverType: serverType,
      apiHost: apiHost
    }
  });
} else {
  console.log('serverType이 올바르지 않습니다.')
}