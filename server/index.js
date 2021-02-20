const httpServer = require('http').Server();
const io = require('socket.io')(httpServer);
const port = 8234;

httpServer.listen(port, () => {
    console.log('正在监听端口：' + port);
});
let rooms = new Array();
let users = new Array();
let roomInfos = new Array();
io.on('connection', (socket) => {
    console.log(socket.id);

    const remoteUser = socket.request.connection.remoteAddress + ':' + socket.request.connection.remotePort;
    console.log('来自' + remoteUser + '的新连接');

    socket.on('coo', (r) => {
        let res = JSON.parse(r);
        users[socket.id] = res.fid;
        if (rooms[res.fid] == null) {
            rooms[res.fid] = [];
        }
        rooms[res.fid].push(socket.id);
        let userNumber = rooms[res.fid].length;
        send(res.fid, 'user-number', userNumber);
        console.log(rooms);
        if (roomInfos[res.fid] != null)
            send(res.fid, 'video-src', JSON.stringify({ user: roomInfos[res.fid][0], src: roomInfos[res.fid][1] }));
    });

    socket.on('disconnect', function () {
        console.log('用户' + remoteUser + '断开连接');
        fid = users[socket.id];
        try {
            for (let i = 0; i < rooms[fid].length; i++) {
                if (rooms[fid][i] == socket.id) {
                    rooms[fid].splice(i, 1);
                    delete users[socket.id];
                    send(fid, 'user-number', rooms[fid].length);
                }
            }
            if (rooms[fid].length == 0) {
                delete rooms[fid];
                delete roomInfos[fid];
            }
        } catch {

        }
    });

    socket.on('video-control', (controlParam) => {
        console.log('用户' + remoteUser + '的消息:' + controlParam);
        send(users[socket.id], 'video-control', controlParam);
    });

    socket.on('video-src', (res) => {
        ress = JSON.parse(res);
        roomInfos[users[socket.id]] = [ress.user, ress.src];
        console.log(roomInfos[users[socket.id]])
        send(users[socket.id], 'video-src', res);
    });

    socket.on('audio', (res) => {
        console.log("au");
        send(users[socket.id], 'audio', res)
    });
});

function send(fid, item, value) {
    rooms[fid].forEach(toId => {
        io.sockets.sockets[toId].emit(item, value);
        console.log(item)
    });
}
