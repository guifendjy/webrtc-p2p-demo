import { AppState } from "./appstate";
import { videoChat } from "./videoChat";
import "./style.css";

const { createElement } = master;

// if user uses a url then the don't have to copy the room id
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get("room");

if (roomParam) {
  AppState.room = roomParam; // sets the room id onload
}

const APP = createElement(
  /*html*/ `
  <div class="{openChat ? 'hide' : ''}" id="main-entry">
    <h1>P2P Video Call</h1>
    <button class="{room != null ? 'hide' : ''}" onclick="createRoom()">Create Room</button>
    <input class="room-input" oninput="handleInput()" value="{room || ''}" type="text" name="room-id" placeholder="Enter Room Id" />
    <button class="{room == null ? 'hide' : ''}" onclick="joinRoom()">Join Room</button>
    <p style="font-size: 0.9rem;">Create or join a room (max occupancy: 2)</p>
  </div>

  <div class="{error ? 'error-card' : 'hide'}" id="error">
    <p>{error ? error.message : ''}</p>
  </div>

  <div class="{!openChat ? 'hide' : ''}" id="chat"></div> <!-- video chat view -->
`,
  AppState
);

// mounting video chat view
APP.getElementById("chat").appendChild(videoChat);

// mount App onto the dom
document.querySelector("#app").appendChild(APP);
