const fs = require("fs");
const httpServer = require('http').Server();
// const httpServer =require("https").createServer({
//     key:fs.readFileSync('/www/server/panel/vhost/ssl/rehtt.com/privkey.pem'),
//     cert:fs.readFileSync('/www/server/panel/vhost/ssl/rehtt.com/fullchain.pem')
// })
const io = require('socket.io')(httpServer);
const port = 8233;
httpServer.listen(port, () => {
    console.log('正在监听端口：' + port);
});

let userId = new Set();
let rooms = new Map();


io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        let roomId = userId[socket.id];
        if (roomId != null) {
            userId.delete(socket.id);
            rooms.get(roomId)['users'].delete(socket.id);

            let userNumber = rooms.get(roomId)['users'].size;
            if (userNumber == 0) {
                rooms.delete(roomId);
            } else {
                send(roomId, 'user-number', userNumber);
            }
        }

    });
    socket.on('room', (id) => {
        if (!rooms.has(id)) {
            rooms.set(id,new Set());
            rooms.get(id)['users']=new Set();
            rooms.get(id)['videoList']=new Array();
        }
        rooms.get(id)['users'].add(socket.id);
        userId[socket.id] = id;
        send(id, 'user-number', rooms.get(id)['users'].size);
        send(id, 'video-list', JSON.stringify(rooms.get(id)['videoList']));
    });
    socket.on('video-control', (controlParam) => {
        send(userId[socket.id], 'video-control', controlParam);
    });
    socket.on('video-list', (res) => {
        try {
            let list = JSON.parse(res)
            rooms.get(userId[socket.id])['videoList'] = list;
            console.log(list)
            send(userId[socket.id], 'video-list', res);
        } catch (error) { }
    });
    socket.on('admin', (password) => {
        if (password === 'qwe') {
            let r = new Set();
            for (let id of rooms.keys()) {
                r[id] = new Set();
                r[id]['users'] = Array.from(rooms.get(id)['users']);
                r[id]['videoList'] = rooms.get(id)['videoList'];
            }
            socket.emit('admin', JSON.stringify(r));
        }
    });
});

function send(roomId, item, value) {
    rooms.get(roomId)['users'].forEach((toId) => {
        io.sockets.sockets[toId].emit(item, value);
        console.log(item)
    });
}
