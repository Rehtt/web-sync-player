import './DPlayer.min.js';
import './vue.min.js';

let WebSocketUrl = 'http://192.168.31.59:8233';

let app = new Vue({
    el: '#app',
    data: {
        socket: null,
        dp: null,
        videoList: Array(),
        videoListUrl: Array(),
        userNumber: 0,
        controlParam: {
            user: '',
            action: '',
            time: '',
            videoListIndex: 0,
        },
        videoUrl: '',
    },
    methods: {
        randomString(length) {
            let str = ''
            for (let i = 0; i < length; i++) {
                str += Math.random().toString(36).substr(2)
            }
            return str.substr(0, length)
        },
        sendControl(state) {
            this.controlParam.action = state;
            this.controlParam.time = this.dp.video.currentTime;
            this.socket.emit('video-control', JSON.stringify(this.controlParam));
        },
        resultHandler(result) {
            switch (result.action) {
                case "play":
                    this.dp.seek(result.time + 0.2); //播放时+0.2秒，抵消网络延迟
                    this.dp.play();
                    break
                case "pause":
                    this.dp.seek(result.time);
                    this.dp.pause();
                    break
                case "seek":
                    this.dp.seek(result.time);
                    break
                case "init":
                    this.playVideo(result.videoListIndex, this.videoList[result.videoListIndex], false);
                    break
            }
        },
        addVideo() {
            if (this.videoUrl) {
                console.log(typeof (this.videoList))
                this.videoList.push(decodeURI(this.videoUrl));
                this.socket.emit('video-list', JSON.stringify(this.videoList));
                mdui.snackbar({
                    message: '添加：' + this.videoUrl,
                });
            }
            // localStorage.setItem('videoList', JSON.stringify(this.videoList))
        },
        playVideo(index, src, f) {
            this.videoUrl = encodeURI(this.videoListUrl[index]);
            this.dp.video.src = this.videoUrl;
            this.dp.seek(0);
            if (f) {
                this.controlParam.videoListIndex = index;
                this.sendControl('init');
            }
            mdui.snackbar({
                message: '播放：' + src,
            });
        },
        deletVideo(index, src) {
            this.videoList.splice(index, 1);
            // localStorage.setItem('videoList', JSON.stringify(this.videoList))
            this.socket.emit('video-list', JSON.stringify(this.videoList));
            mdui.snackbar({
                message: '删除：' + src,
            });
        },
        share(src) {
            let aux = document.createElement("input");
            aux.setAttribute("value", window.location.href + '?video=' + encodeURI(src));
            document.body.appendChild(aux);
            aux.select();
            document.execCommand("copy");
            document.body.removeChild(aux);
            mdui.snackbar({
                message: '已复制到剪切板',
            });
        },
        getQueryString(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        },
        socketInit() {
            this.socket = new io(WebSocketUrl);
            this.socket.emit('room', 'asd')
            this.socket.on('video-control', (res) => {
                let result = JSON.parse(res);
                if (result.user != this.controlParam.user) {
                    this.resultHandler(result)
                }
            });
            this.socket.on('user-number', (res) => {
                this.userNumber = res;
            });
            this.socket.on('video-list', (res) => {
                this.videoListUrl = [];
                this.videoList = [];
                let list = JSON.parse(res);
                for (let i = 0; i < list.length; i++) {
                    let n = list[i].split('/');
                    if (n[n.length - 1] != '') {
                        this.videoList.push(n[n.length - 1]);
                        this.videoListUrl.push(list[i]);
                    }
                }

            });
        }

    },
    created() {
        this.controlParam.user = this.randomString(10);
        this.videoList = [];
        // let localList = JSON.parse(localStorage.getItem('videoList'));
        // this.videoList = localList ? localList : [];

        // let currentPlayVideo = localStorage.getItem('currentPlayVideo');
        // let video = this.getQueryString('video');

        // this.videoUrl = video ? video : currentPlayVideo ? currentPlayVideo : '';
        mdui.prompt('请输入房间号', '房间',
            function (value) {
                if (value == '') {
                    mdui.confirm('输入正确房间号', function () {
                        location.reload();
                    }, function () {

                    },
                    {
                        closeOnEsc: false,
                        modal: true,
                        history: false,
                        closeOnCancel: false
                    });
                } else {
                    app.socketInit();
                }
            },
            function (value) { },
            {
                confirmOnEnter: true,
                closeOnEsc: false,
                modal: true,
                history: false,
                closeOnCancel: false
            }
        );
    },
    mounted() {
        this.dp = new DPlayer({
            container: document.getElementById('DPlayer'),
            video: {
                url: this.videoUrl,
            },
            playbackSpeed: false,
            volume: 1,
            contextmenu: [
                {
                    text: 'Rehtt',
                    link: 'https://rehtt.com',
                },
            ],
        });

        this.dp.on('pause', () => {
            this.sendControl('pause');
        });
        this.dp.on('play', () => {
            this.sendControl('play');
        });


        document.getElementsByClassName("dplayer-setting")[0].style.display = "none";
        //隐藏指定菜单
        let b_m = document.getElementsByClassName("dplayer-menu-item");
        b_m[b_m.length - 2].style.display = "none";
        b_m[b_m.length - 1].style.display = "none";
    }
})