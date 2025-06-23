import { AppState } from "./appstate";

const { createElement } = master;

const remoteMediaState = /*html*/ `
<div style="display: flex;
    gap: 10px;
    font-weight: bold;
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
        <div class="{!callCreatedLocally ? 'hide' : ''}" style="display: flex; gap: 2px; align-items: center;">
                <h3>show room info</h3>
                <input checked="{showRoomInfo}" type="checkbox" onchange="hideRoomInfo()">
        </div>

        <div style="display: flex; flex-direction: column; align-items: center;" class="{!callCreatedLocally || !showRoomInfo ? 'hide' : ''}">
                <div style="display: flex; gap:5px; align-items: center;">
                        <span>Room Link:</span>
                        <input id="room" class="room-input" disabled  type="text" value="{roomLink || ''}" />
                        <button onclick="copyRoom(roomLink)">copy</button>
                </div>
                <br/>
                <div style="display: flex; gap:5px; align-items: center;">
                        <span>Room Id:</span>
                        <input id="room" class="room-input" disabled  type="text" value="{room || ''}" />
                        <button onclick="copyRoom(room)">copy</button>
                </div>
                <p style="font-size: 0.9rem;">Share this room link or room ID with someone to let them join the call.</p>
        </div>
        <div class="video-chat-container">
                <div class="video-frame sender">
                        ${remoteMediaState} <!-- media state of remote feed -->
                        <video id="remoteVideo"  autoplay playsInline></video>
                </div>
                <div class="video-frame receiver">
                        <video id="localVideo" autoplay playsInline></video>
                </div>
        </div>

        <div>
                <button onclick="endChat()">end call</button>
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
