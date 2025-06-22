import { AppState } from "./appstate";
import "./style.css";
import { videoChat } from "./videoChat";

const { createElement } = master;

const app = createElement(
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

  <div class="{!openChat ? 'hide' : ''}" id="chat"></div>
`,
  AppState
);

app.getElementById("chat").appendChild(videoChat); // mounting video chat

// mount onto the dom
document.querySelector("#app").appendChild(app);
