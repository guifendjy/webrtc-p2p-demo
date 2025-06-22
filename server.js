import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: process.env.APP_URL || "*",
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const allRooms = {};

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
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  socket.on("media-state", ({ room, type, enabled }) => {
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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
