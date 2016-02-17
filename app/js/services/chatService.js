function ChatService($http) {
    'ngInject';

    const service = {};

    service.get = function() {
        return new Promise((resolve, reject) => {
            $http.get('apiPath').success((data) => {
                resolve(data);
            }).error((err, status) => {
                reject(err, status);
            });
        });
    };

    service.new = function() {
        this.url = "";
        this.socket = null;
        this.is_connected = false;
        this.room = {name: "", clients: [], updated: false};
        this.clients = {};
        this.info_transmitted = 0;
        this.info_received = 0;

        this.feedback = false; //if you want message to bounce back to you

        this.user_id = 0;
        this.user_name = "anonymous";

        this.on_connect = null;
        this.on_message = null;
        this.on_close = null;
        this.on_user_connected = null;
        this.on_user_disconnected = null;

    };

    service.connect = function(url, room_name, on_connect, on_message, on_close, on_event) {
            room_name = room_name || "";
            var that = this;
            this.url = url;
            if (!url) {
                throw("You must specify the server URL of the SillyServer");
            }
            if (this.socket){
                this.socket.close();
            }
            if (typeof(WebSocket) === "undefined") {
                WebSocket = window.MozWebSocket;
            }
            if (typeof(WebSocket) === "undefined") {
                alert("Websockets not supported by your browser, consider switching to the latest version of Firefox, Chrome or Safari.");
                return;
            }

            var params = "";
            if (this.feedback){
                params = "?feedback=1";
            }
//connect
            this.socket = new WebSocket("ws://" + url + "/" + room_name + params);
            this.socket.onopen = function () {
                that.is_connected = true;
                console.log("Socket has been opened! :)");
                if (on_connect && typeof(on_connect) === "function") {
                    on_connect();
                }
                if (that.on_connect) {
                    that.on_connect();
                }
            };

            this.socket.addEventListener("close", function (e) {
                console.log("Socket has been closed: ", e);
                if (on_close) {
                    on_close();
                }
                if (that.on_close) {
                    that.on_close(e);
                }
                that.socket = null;
                that.room = null;
                that.is_connected = false;
            });

            this.socket.onmessage = function (msg) {
                that.info_received += 1;

                var tokens = msg.data.split("|"); //author id | cmd | data
                console.log(tokens);
                if (tokens.length < 3){
                    console.log("Received: " + msg.data); //Awesome!
                }
                else{
                    that.onServerEvent(tokens[0], tokens[1], msg.data.substr(tokens[0].length + tokens[1].length + 2, msg.data.length), on_message, on_event);
                }
            };

            this.socket.onerror = function (err) {
                console.log("error: ", err);
            };

            return true;
    };


//Close the connection with the server
    service.close = function () {
        if (!this.socket){
            return;
        }

        this.socket.close();
        this.socket = null;
    };

//Process events
    service.onServerEvent = function (author_id, cmd, data, on_message, on_event) {
        if (cmd === "MSG") //user message received
        {
            if (on_message) {
                on_message(author_id, data);
            }
            if (this.on_message) {
                this.on_message(author_id, data);
            }
        }
        else if (cmd === "LOGIN") //new user entering
        {
            console.log("User connected: " + data);
            var name = "user_" + author_id.toString();
            this.clients[author_id] = {id: author_id, name: name};
            if (author_id !== this.user_id) {
                if (this.on_user_connected) { //somebody else is connected
                    this.on_user_connected(author_id, data);
                }
            }
            if (on_event) {
                on_event("LOGIN", name);
            }

        }
        else if (cmd === "LOGOUT") //user leaving
        {
            var aux = '';
            if (this.clients[author_id]) {
                console.log("User disconnected: " + this.clients[author_id].name);
                aux = this.clients[author_id].name;
            }

            if (this.on_user_disconnected) {//somebody else is connected
                this.on_user_disconnected(author_id);
            }
            delete this.clients[author_id];
            var pos = this.room.clients.indexOf(author_id);
            if (pos !== -1) {
                this.room.clients.splice(pos, 1);
            }
            if (on_event && aux !== '') {
                on_event("LOGOUT", aux);
            }
        }
        else if (cmd === "ID") //retrieve your user id
        {
            this.user_id = author_id;
            this.user_name = "user_" + author_id.toString();
            this.clients[author_id] = {id: author_id, name: this.user_name};
            if (this.on_ready) {
                this.on_ready(author_id);
            }
        }
        else if (cmd === "INFO") //retrieve room info
        {
            var room_info = JSON.parse(data);
            this.room = room_info;
            if (this.on_room_info) {
                this.on_room_info(room_info);
            }
            if (on_event) {
                on_event("INFO", 'user_'+author_id);
            }
        }
    };

//target_ids is optional, if not specified the message is send to all
    service.sendMessage = function (msg, sat, target_ids) {
        if (msg === null) {
            return;
        }

        if (typeof(msg) === "object") {
            msg = JSON.stringify(msg);
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error("Not connected, cannot send info");
            return;
        }

        //pack target info
        if (msg.constructor === String && target_ids) {
            msg = "@" + target_ids.join(",") + "|" + msg;
        }

        this.socket.send(msg);
        this.info_transmitted += 1;
    };

//To store temporal information in the server
    service.storeData = function (key, value, on_complete) {
        if (!this.url) {
            throw("Cannot storeData if not connected to the server");
        }
        var req = new XMLHttpRequest();
        req.open('GET', "http://" + this.url + "/data?action=set&key=" + key + ((value !== undefined && value !== null) ? "&value=" + value : ""), true);
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    return console.error("Error setting data: ", req.responseText);
                }
                if (on_complete) {
                    on_complete(JSON.parse(req.responseText));
                }
            }
        };
        req.send(null);
    };

//To retrieve the temporal information from the server
    service.loadData = function (key, on_complete) {
        if (!this.url) {
            throw("Cannot loadData if not connected to the server");
        }
        var req = new XMLHttpRequest();
        req.open('GET', "http://" + this.url + "/data?action=get&key=" + key, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    return console.error("Error setting data: ", req.responseText);
                }
                var resp = JSON.parse(req.responseText);
                if (on_complete) {
                    on_complete(resp.data);
                }
            }
        };
        req.send(null);
    };

//Returns a report with information about clients connected and rooms open
    service.getReport = function (on_complete) {
        var req = new XMLHttpRequest();
        req.open('GET', "http://" + this.url + "/info", true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    return console.error("Error getting report: ", req.responseText);
                }
                var resp = JSON.parse(req.responseText);
                if (on_complete) {
                    on_complete(resp);
                }
            }
        };
        req.send(null);
    };

//Returns info about a room (which clients are connected now)
    service.getRoomInfo = function (name, on_complete) {
        var req = new XMLHttpRequest();
        req.open('GET', "http://" + this.url + "/room/" + name, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    return console.error("Error getting room info: ", req.responseText);
                }
                var resp = JSON.parse(req.responseText);
                if (on_complete) {
                    on_complete(resp.data);
                }
            }
        };
        req.send(null);
    };

//Returns a list with all the open rooms that start with txt (txt must be at least 6 characters long)
    service.findRooms = function (txt, on_complete) {
        var req = new XMLHttpRequest();
        req.open('GET', "http://" + this.url + "/find?name=" + name, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    return console.error("Error getting room info: ", req.responseText);
                }
                var resp = JSON.parse(req.responseText);
                if (on_complete) {
                    on_complete(resp.data);
                }
            }
        };
        req.send(null);
    };

    return service;

}

export default {
    name: 'ChatService',
    fn: ChatService
};
