import { uniid, createRoomCall, disconectCall, emitMediaState } from "./utils";

// will add error handling by adding try-catch blck
export const APP_URL = "http://localhost:3000";

export const AppState = new master.ReactiveState({
  localVideo: null,
  remoteVideo: null,
  openChat: false,
  room: null,
  micOff: false,
  cameraOff: false,
  remoteMediaState: null,
  error: null,
  callCreatedLocally: false,
  roomLink: null,
  showRoomInfo: true,
  hideRoomInfo({ target: { checked } }) {
    // toggle the visibility of room info
    this.showRoomInfo = checked;
  },
  handleInput({ target: { value } }) {
    this.room = value;
    if (value == "") this.room = null;
  },
  async joinRoom() {
    if (!this.room) return;
    this.showChat();

    await createRoomCall(
      this.room,
      this.localVideo,
      this.remoteVideo,
      "join-room"
    );
  },
  async createRoom() {
    this.room = uniid("room", 15).toUpperCase();

    await createRoomCall(
      this.room,
      this.localVideo,
      this.remoteVideo,
      "create-room"
    );

    this.callCreatedLocally = true;
    this.showChat();
  },
  endChat() {
    disconectCall(); // cleans up the socket

    this.openChat = false;
    this.room = null;
    this.micOff = false;
    this.cameraOff = false;
    this.remoteMediaState = null;
    this.error = null;
    this.callCreatedLocally = false;
    this.roomLink = null;

    this.localVideo.srcObject = null;
    this.remoteVideo.srcObject = null;
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
    emitMediaState(this.room, "video", !!videoTrack.enabled);

    this.cameraOff = !this.cameraOff;
  },
  showChat() {
    !this.error && (this.openChat = true);
  },
  copyRoom(copiedText, { target }) {
    navigator.clipboard
      .writeText(copiedText)
      .then(() => {
        target.textContent = "copied";

        setTimeout(() => {
          target.textContent = "copy";
        }, 500);
      })
      .catch((err) => {
        this.error = err;
      });
  },
});

AppState.subscribe(
  "room",
  () => (AppState.roomLink = `${APP_URL}/?room=${AppState.room}`)
);
