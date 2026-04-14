require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const Message = require('./messageModel');

const app = express();
app.use(cors());

// 🔥 MongoDB connect (use env variable)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🧠 Store users
let users = {};

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('joinRoom', async ({ username, room }) => {
    users[socket.id] = { username, room };

    socket.join(room);

    const messages = await Message.find({ room });

    messages.forEach(msg => {
      socket.emit('message', msg);
    });

    io.to(room).emit('message', {
      user: "System",
      text: `${username} joined ${room}`
    });

    const roomUsers = Object.values(users).filter(u => u.room === room);
    io.to(room).emit('users', roomUsers);
  });

  socket.on('sendMessage', async (message) => {
    const userData = users[socket.id];

    if (userData) {
      const msgData = {
        user: userData.username,
        text: message,
        room: userData.room
      };

      const newMsg = new Message(msgData);
      await newMsg.save();

      io.to(userData.room).emit('message', msgData);
    }
  });

  socket.on('typing', () => {
    const userData = users[socket.id];

    if (userData) {
      socket.to(userData.room).emit('typing', {
        user: userData.username
      });
    }
  });

  socket.on('disconnect', () => {
    const userData = users[socket.id];

    if (userData) {
      const room = userData.room;

      io.to(room).emit('message', {
        user: "System",
        text: `${userData.username} left`
      });

      delete users[socket.id];

      const roomUsers = Object.values(users).filter(u => u.room === room);
      io.to(room).emit('users', roomUsers);
    }
  });
});

app.get('/', (req, res) => {
  res.send("Chat Server Running 🚀");
});

// ✅ IMPORTANT: dynamic port
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});