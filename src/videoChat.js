import { AppState } from "./appstate";

const { createElement } = master;

const remoteMediaState = /*html*/ `
<div style="display: flex; gap: 10px; font-weight: bold;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
   ">
{start:if remoteMediaState && !remoteMediaState.micOff}
    <p class="btn">muted</p>
{end:if}

{start:if remoteMediaState && !remoteMediaState.cameraOff}
    <p class="btn">camera off</p>
{end:if}
</div>
`;

export let videoChat = createElement(
  /*html*/ `
  <div class="chat">
    <div class="{room == null ? 'hide' : ''} ">
        <label for="room">
        room Id:
        <input id="room" class="room-input" disabled  type="text" value="{room || ''}" />
        </label>
        <button onclick="copyRoom()">{roomCopied ? 'copied' : 'copy'}</button>
    </div>
    <div class="video-chat-container">
        <div class="video-frame sender">
            ${remoteMediaState}
            <video id="remoteVideo"  autoplay playsInline></video>
        </div>
        <div class="video-frame receiver">
            <video id="localVideo" autoplay playsInline></video>
        </div>
    </div>

    <div>
        <button onclick="endChat">end chat</button>
        <button onclick="toggleMicOff()">{!micOff ? 'mute' : 'unmute'}</button>
        <button onclick="toggleCameraOff()">{!cameraOff ? 'camera off' : 'camera on'}</button>
    </div>
</div>
`,
  AppState
);

// bind node to state
AppState.localVideo = videoChat.getElementById("localVideo");
AppState.remoteVideo = videoChat.getElementById("remoteVideo");
