console.log("hello world")

var express = require("express");
var app = express();
var serv = require("http").Server(app);
var io = require("socket.io")(serv,{});

app.get("/",function(req,res){
    res.sendFile(__dirname + "/client/index.html")
})
app.use("/client",express.static(__dirname + "/client"))

serv.listen(process.env.PORT || 2000);
var SOCKET__LIST={};
var PLAYER__LIST={};

var Entity=function(){
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x+=self.spdX;
        self.y+=self.spdY;
    }
    return self;
}

var Player = function(id){
    var self= Entity();
    self.id=id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight=false;
    self.pressingLeft=false;
    self.pressingUp=false;
    self.pressingDown=false;
    self.maxSpd=10;
    
    var super_update = self.update;
    self.update=function(){
        self.updateSpd();
        super_update();
    }
    
    self.updateSpd = function(){
        if(self.pressingRight){
            self.spdX=self.maxSpd
        } else if(self.pressingLeft){
            self.spdX= -self.maxSpd
        }else{
            self.spdX=0
        }
        if(self.pressingUp){
            self.spdY= -self.maxSpd
        } else if(self.pressingDown){
            self.spdY=self.maxSpd
        }else{
            self.spdY=0
        }
    }
    Player.list[id]=self;
    return self;
}
Player.list = {};

Player.onConnect = function(socket){
    var player = Player(socket.id);
    
    socket.on("keyPress",function(data){
        if(data.inputId==="left"){
            player.pressingLeft=data.state;
        }else if(data.inputId==="right"){
            player.pressingRight=data.state;
        }else if(data.inputId==="up"){
            player.pressingUp=data.state;
        }else if(data.inputId==="down"){
            player.pressingDown=data.state;
        }
    })
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}
Player.update = function(){
    var pack=[];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number,
            peerId:player.peerId
        })
    }
     return pack;
}

//var Bullet = function(angle){
//    var self = Entity();
//    self.id = Math.random();
//    self.spdX = Math.cos(angle/180*Math.PI) * 10;
//    self.spdY = Math.sin(angle/180*Math.PI) * 10;
//    
//    self.timer = 0;
//    self.toRemove = false;
//    var super_update = self.update;
//    self.update = function(){
//        if(self.timer++>100){
//            self.toRemove=true;
//        }
//        super_update();
//    }
//    Bullet.list[self.id]=self;
//    return self;
//}
//Bullet.list = {};
//Bullet.update = function(){
//    if(Math.random()<0.1){
//        Bullet(Math.random()*360);
//    }
//    
//    var pack=[];
//    for(var i in Bullet.list){
//        var bullet = Bullet.list[i];
//        bullet.update();
//        pack.push({
//            x:bullet.x,
//            y:bullet.y
//        })
//    }
//    return pack;
//}


io.sockets.on("connection",function(socket){
    socket.id = Math.random();
    SOCKET__LIST[socket.id]=socket;
    
     // To subscribe the socket to a given channel
     socket.on('join', function (data) {
      Player.list[socket.id].peerId = data.id;
         sendPeerIds()
         console.log(Player.list)
     });
    
    Player.onConnect(socket);
 
    socket.on("disconnect",function(){
        delete SOCKET__LIST[socket.id];
        Player.onDisconnect(socket);
        delete Player.list[socket.id];
    })
});

function sendPeerIds(){
    var pack=[];
    for(var i in Player.list){
        var player = Player.list[i];
        pack.push({
            peerId:player.peerId
        })
    }
    for(var i in SOCKET__LIST){
            var socket = SOCKET__LIST[i];
            socket.emit("peerId",pack)
        }
}

setInterval(function(){
    var pack = {
        player:Player.update(),
    }

    for(var i in SOCKET__LIST){
            var socket = SOCKET__LIST[i];
            socket.emit("newPosition",pack)
        }
},1000/25)