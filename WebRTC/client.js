 var SIGNALING_SERVER = 'http://localhost:3000/';
 // To create a new connection to the signaling server
 socket = io.connect(SIGNALING_SERVER);
 socket.on('connect', function () {
   // To subscribe the socket to a given channel
   socket.emit('join', {
     username: loggedInUser.username
   });
 });
 // For sending message
 socket.send = function (message) {
   socket.emit('message', {
     fromUsername: peer.fromUsername,
     toUsername: peer.toUsername,
     data: message
   });
 };
 socket.on('disconnect', function () {
   // To intimate other clients about disconnection from server
   socket.emit('disconnect', {
     username: loggedInUser.username
   });
 });
 // To keep track of online users
 socket_client.on('onlineUsers', function (onlineUsers) {
   $.each(onlineUsers, function (n, user) {
     if (user &amp;&amp; user.username != loggedInUser.username &amp;&amp; !(user.username == 'undefined' || user.username == '')) {
       chatObject.data.connections[user.username] = {
       onlineStatus: 'online'
       };
     }
  });
 });
 // To listen for other clients' disconnection from server
 socket_client.on('disconnected', function (username) {
   chatObject.data.connections[username] = {
     onlineStatus: 'offline',
   };
 });
 
 // To intimate other clients about online presence
 socket_client.emit('userPresence', {
   username: username
 });