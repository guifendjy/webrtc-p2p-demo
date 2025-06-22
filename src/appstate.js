import { uniid, createRoomCall, disconectCall, emitMediaState } from "./utils";

// will add error handling by adding try-catch blck

export const AppState = new master.ReactiveState({
  localVideo: null,
  remoteVideo: null,
  openChat: false,
  room: null,
  roomCopied: false,
  micOff: false,
  cameraOff: false,
  remoteMediaState: null,
  error: null,
  handleInput({ target: { value } }) {
    this.room = value;
    if (value == "") this.room = null;
  },
  async joinRoom() {
    if (!this.room) return;
    await createRoomCall(
      this.room,
      this.localVideo,
      this.remoteVideo,
      "join-room"
    );
    this.showChat();
  },
  async createRoom() {
    this.room = uniid("room", 15).toUpperCase();

    this.showChat();
    await createRoomCall(
      this.room,
      this.localVideo,
      this.remoteVideo,
      "create-room"
    );
  },
  endChat() {
    disconectCall(this.remoteVideo); // cleans up the socket
    this.openChat = false;
    this.room = null;
    this.remoteMediaState = null;
    this.micOff = false;
    this.cameraOff = false;
  },
  toggleMicOff() {
    const localStream = this.localVideo.srcObject;
    const audioTrack = localStream.getAudioTracks()[0];

    audioTrack.enabled = !audioTrack.enabled;
    emitMediaState(this.room, "audio", !!audioTrack.enabled);

    this.micOff = !this.micOff;
  },
  toggleCameraOff() {
    const localStream = this.localVideo.srcObject;
    const videoTrack = localStream.getVideoTracks()[0];

    videoTrack.enabled = !videoTrack.enabled;
    emitMediaState(this.room, "video", videoTrack.enabled);

    this.cameraOff = !this.cameraOff;
  },
  showChat() {
    !this.error && (this.openChat = true);
  },
  copyRoom() {
    navigator.clipboard
      .writeText(this.room)
      .then(() => {
        this.roomCopied = true;
        setTimeout(() => (this.roomCopied = false), 500);
      })
      .catch((err) => {
        this.error = err;
      });
  },
});
