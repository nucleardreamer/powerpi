var os = require('os');
var socketClient = require('socket.io-client');

var NodeReporter = function(nodeNum){
    var _this = this;

    _this.url = "http://www.node-hive.io";

    _this.nodeNum = nodeNum;

    _this.io = socketClient(_this.url);

    _this.io.on('connect', function(socket){
        _this.connect(socket, _this.nodeNum);
    });

    _this.io.on('disconnect', _this.disconnect);

    return this;

};

NodeReporter.prototype.disconnect = function () {
    console.log('disconnected from node-hive.io');
};

NodeReporter.prototype.connect = function (socket, nodeNum) {
    console.log('connection');
    var _this = this;

    var reg = {
        nodeNum: nodeNum,
        os: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        mem: {
            total: os.totalmem(),
            free: os.freemem()
        }
    };

    // timeout just to be safe
    setTimeout(function () {
        console.log(reg);
        _this.io.emit('node_register', reg);
    }, 500);
};

module.exports = NodeReporter;