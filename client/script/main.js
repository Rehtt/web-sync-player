import './DPlayer.min.js';
import './vue.min.js';

new Vue({
    el: '#app',
    data: {
        socket: null,
        dp: null,
        fid: '',
        videoList: [],
        userNumber: 0,
        userId: '',
        controlParam: {
            user: '',
            action: '',
            time: '',
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
            }
        },
        addVideo() {
            if (this.videoUrl) {
                this.videoList.push(decodeURI(this.videoUrl))
                mdui.snackbar({
                    message: '添加：' + this.videoUrl,
                });
            }
            localStorage.setItem('videoList', JSON.stringify(this.videoList))
        },
        playVideo(src) {
            this.dp.video.src = this.videoUrl;
            this.dp.seek(0);
            localStorage.setItem('currentPlayVideo', src)
            mdui.snackbar({
                message: '播放：' + src,
            });
            // this.socket.emit('video-src', JSON.stringify({ src: src, user: this.userId }))
        },
        deletVideo(index, src) {
            this.videoList.splice(index, 1)
            localStorage.setItem('videoList', JSON.stringify(this.videoList))
            mdui.snackbar({
                message: '删除：' + src,
            });
        },
        share(src) {
            let aux = document.createElement("input");
            aux.setAttribute("value", window.location.href + '?video=' + src);
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
        }

    },
    created() {
        this.userId = this.randomString(10);

        let localList = JSON.parse(localStorage.getItem('videoList'));
        this.videoList = localList ? localList : [];

        let currentPlayVideo = localStorage.getItem('currentPlayVideo');
        let video = this.getQueryString('video');

        this.videoUrl = video ? video : currentPlayVideo ? currentPlayVideo : '';

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
        this.socket = new io('http://rehtt.com:8233');
        this.socket.emit('coo', JSON.stringify({ fid: this.fid }));
        this.socket.on('video-control', (res) => {
            let result = JSON.parse(res);
            if (result.user !== this.userId) {
                this.resultHandler(result)
            }
        });
        this.socket.on('user-number', (res) => {
            this.userNumber = res;
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