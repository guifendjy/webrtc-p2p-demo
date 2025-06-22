import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // or '*' for dev
    methods: ["GET", "POST"],
  },
});

app.use(express.static("public"));

const allRooms = {};
const mediaState = {};

io.on("connection", (socket) => {
  socket.on("create-room", (roomId, callback) => {
    if (!allRooms[roomId]) {
      callback({ success: true });
    } else {
      return;
    }

    allRooms[roomId] = [...(allRooms[roomId] || []), socket.id];
    socket.join(roomId); // whoever creates joins first
  });

  socket.on("join-room", (roomId, callback) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const roomSize = room ? room.size : 0;

    if (roomSize >= 2 || !room) {
      return callback({
        success: false,
        error: "Room is full or does not exist.",
      });
    } else {
      callback({ success: true });
    }

    allRooms[roomId] = [...(allRooms[roomId] || []), socket.id];

    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);

    // if (mediaState[roomId]) {
    //   console.log(mediaState[roomId]);
    //   mediaState[roomId].forEach(({ type, enabled }) => {
    //     socket.to(socket.id).emit("media-state", { type, enabled });
    //   });
    // }
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  socket.on("media-state", ({ room, type, enabled }) => {
    mediaState[room] = [
      ...(mediaState[room] || []),
      {
        type,
        enabled,
      },
    ];

    socket.to(room).emit("media-state", {
      type,
      enabled,
    });
  });

  // gotta now in which room the user that left is
  socket.on("disconnect", () => {
    leaveRoom(socket.id, socket);
  });
});

function leaveRoom(socketId, socket) {
  let room = null;
  Object.keys(allRooms).forEach((currentRoom) => {
    if (allRooms[currentRoom]?.some((sId) => sId == socketId)) {
      room = currentRoom;
    }
  });

  if (room) {
    socket.to(room).emit("user-left", socket.id);
    delete allRooms[room];
  }
}

server.listen(3000, () => console.log("http://localhost:3000"));
