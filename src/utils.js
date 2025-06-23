import { io } from "socket.io-client";
import { AppState, APP_URL } from "./appstate";

//TODO: encrypt offer sent via socket for security because I assume that
// anyone can intercept the offer and hook on to the peerConnection by sending back their own answer.(research this)

export function uniid(prefix = "", length = 10) {
  const random = Math.random().toString(36).substring(2); // Generate a random base-36 string
  const timestamp = Date.now().toString(36); // Add a timestamp for uniqueness
  const uniqueId = (random + timestamp).substring(0, length); // Ensure the desired length
  return prefix ? `${prefix}_${uniqueId}` : uniqueId; // Add prefix if provided
}

let socket = null;
const peerConnections = {};

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let localStream;

export function disconectCall() {
  if (socket) {
    closePeerConnection(socket.id);
    socket.disconnect();
    socket = null;
  }
}

function closePeerConnection(id) {
  peerConnections[id]?.close();
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
}

export function emitMediaState(room, type, enabled) {
  if (socket) {
    socket.emit("media-state", { room, type, enabled });
  }
}

export async function createRoomCall(room, localVideo, remoteVideo, action) {
  AppState.error = null;
  AppState.remoteMediaState = null;

  try {
    // Initialize socket connection
    socket = io(APP_URL, { timeout: 5000 });

    // ✅ Wait for room join confirmation
    const roomStatus = await new Promise((resolve) => {
      socket.emit(action, room, (response) => {
        resolve(response); // server sends { success: true } or { error: "Room full" }
      });
    });

    if (!roomStatus.success) {
      AppState.endChat();
      AppState.error = { message: roomStatus.error || "Room join failed." };
      return;
    }

    // ✅ Room is good, get user media
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.srcObject = localStream;
    remoteVideo.srcObject = new MediaStream();

    // 🔌 Join event received when someone else connects
    socket.on("user-joined", (socketId) => {
      const pc = createPeerConnection(socketId, localStream, remoteVideo);
      peerConnections[socketId] = pc;

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("signal", { to: socketId, signal: pc.localDescription });
        })
        .catch((err) => {
          AppState.endChat();
          AppState.error = { message: "Failed to create offer." };
        });

      // this sends out the initial media state to remote onconnection
      // (might have a better way of doing it, it need to be sent when the user
      // that joins actually accepts the WebRTC offer signal)
      setTimeout(() => {
        emitMediaState(
          room,
          "audio",
          localVideo?.srcObject.getAudioTracks()[0]?.enabled
        );

        emitMediaState(
          room,
          "video",
          localVideo?.srcObject.getVideoTracks()[0]?.enabled
        );
      }, 500);
    });

    // 🔄 Handle incoming signals
    socket.on("signal", async ({ from, signal }) => {
      try {
        let pc =
          peerConnections[from] ||
          createPeerConnection(from, localStream, remoteVideo);
        peerConnections[from] = pc;

        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { to: from, signal: answer });
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          // emits remote media state
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        AppState.endChat();
        AppState.error = { message: "WebRTC signaling error." };
      }
    });

    // handle user leaving the call
    socket.on("user-left", (socketId) => {
      AppState.endChat();
      AppState.error = { message: `${socketId} left.` };
      setTimeout(() => {
        closePeerConnection(socketId);
      }, 1000); // give some time to clean up
    });

    socket.on("disconnect", () => {
      AppState.endChat();
    });

    // handle remote mic and camera state(this gets rid of confusion)
    socket.on("media-state", ({ type, enabled }) => {
      if (!AppState.remoteMediaState)
        AppState.remoteMediaState = { micOff: true, cameraOff: true }; // initilizes it here

      if (type == "audio") {
        AppState.remoteMediaState = {
          ...AppState.remoteMediaState,
          micOff: enabled,
        };
      }
      if (type == "video") {
        AppState.remoteMediaState = {
          ...AppState.remoteMediaState,
          cameraOff: enabled,
        };
      }
    });
  } catch (error) {
    AppState.endChat();
    AppState.error = {
      message: "Could not start video/audio or connect to server.",
    };
  }
}

function createPeerConnection(id, stream, remoteVideo) {
  const pc = new RTCPeerConnection(servers);

  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      if (socket) socket.emit("signal", { to: id, signal: candidate });
    }
  };

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0]; // set remote audio stream
  };

  return pc;
}
