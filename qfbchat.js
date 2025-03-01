// QfB Chat with username support and automatic offer/answer

// --- Codeword ---
const codeword = "rhombicosidodecahedron";
let authenticated = false;
let viewOnly = false;
let username = "";
let isOfferer = false; // Determine if this peer is the offerer

// --- Signaling Server (Simplified Example - Replace with a real one) ---
const signalingServer = {
  peers: {},
  registerPeer: (id, offer) => {
    signalingServer.peers[id] = offer;
  },
  getPeer: (id) => {
    return signalingServer.peers[id];
  },
  removePeer: (id) => {
    delete signalingServer.peers[id];
  },
};

// --- WebRTC Setup ---
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let peerConnection;
let dataChannel;
let messageQueue = [];

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && (authenticated || viewOnly)) {
      console.log("ICE candidate sent");
    }
  };

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel();
  };
};

const setupDataChannel = () => {
  dataChannel.onopen = () => {
    console.log("Data channel opened");
    processMessageQueue();
  };

  dataChannel.onmessage = (event) => {
    let message = event.data;
    message = filterSwearWords(message);
    const parts = message.split(":", 1);
    let sender = "Other Peer";
    if (parts.length > 0) {
      sender = parts[0];
      message = message.substring(sender.length + 1);
    }
    console.log("Received:", message);
    displayMessage(sender, message);
  };

  dataChannel.onclose = () => {
    console.log("Data channel closed");
  };
};

const createOffer = async () => {
  createPeerConnection();
  dataChannel = peerConnection.createDataChannel("chat");
  setupDataChannel();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log("Offer sent");
  signalingServer.registerPeer("myPeerId", offer);
};

const createAnswer = async (offer) => {
  createPeerConnection();
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  console.log("Answer sent");
};

const setRemoteDescription = async (answer) => {
  await peerConnection.setRemoteDescription(answer);
};

const sendMessage = (message) => {
  if (dataChannel && dataChannel.readyState === "open" && authenticated) {
    message = filterSwearWords(message);
    dataChannel.send(username + ": " + message);
    displayMessage("You", message);
  } else if (!authenticated) {
    alert("Enter the codeword first.");
  } else {
    messageQueue.push(message);
  }
};

const processMessageQueue = () => {
  if (dataChannel && dataChannel.readyState === "open") {
    messageQueue.forEach((queuedMessage) => {
      let message = filterSwearWords(queuedMessage);
      dataChannel.send(username + ": " + message);
      displayMessage("You", message);
    });
    messageQueue = [];
  }
};

const displayMessage = (sender, message) => {
  const chatLog = document.getElementById("chatLog");
  const messageElement = document.createElement("p");
  messageElement.textContent = `${sender}: ${message}`;
  chatLog.appendChild(messageElement);
};

const authenticate = async () => {
  const codewordInput = document.getElementById("codewordInput").value;
  username = document.getElementById("usernameInput").value;
  if (!username) {
    alert("Please enter a username.");
    return;
  }
  if (codewordInput === codeword) {
    authenticated = true;
    document.getElementById("codewordSection").style.display = "none";
    document.getElementById("chatSection").style.display = "block";
    document.getElementById("viewOnlySection").style.display = "none";

    // Automatic Offer/Answer logic
    if (Object.keys(signalingServer.peers).length === 0) {
      isOfferer = true;
      await createOffer();
    } else {
      const offer = signalingServer.getPeer("otherPeerId");
      if (offer) {
        await createAnswer(offer);
        await setRemoteDescription(signalingServer.getPeer("myPeerId"));
      }
    }
  } else {
    alert("Incorrect codeword.");
  }
};

const viewOnlyMode = () => {
  viewOnly = true;
  document.getElementById("codewordSection").style.display = "none";
  document.getElementById("chatSection").style.display = "block";
  document.getElementById("viewOnlySection").style.display = "none";
  document.getElementById("messageInput").disabled = true;
  document.getElementById("sendButton").disabled = true;
  document.getElementById("offerButton").disabled = true;
  document.getElementById("answerButton").disabled = true;
  document.getElementById("remoteDescriptionButton").disabled = true;
};

const showRules = () => {
  document.getElementById("rulesPage").style.display = "block";
  document.getElementById("codewordSection").style.display = "none";
  document.getElementById("chatSection").style.display = "none";
  document.getElementById("viewOnlySection").style.display = "none";
};

const hideRules = () => {
  document.getElementById("rulesPage").style.display = "none";
  document.getElementById("codewordSection").style.display = "block";
};

// --- Swear Filter ---
const swearWordsBase64 = [
  "ZnVjaw==",
  "c2hpdA==",
  "Yml0Y2g=",
  "Y3VudA==",
  "YXNzc2hvbGU=",
  "cGlzcw==",
  "YW50aWJhbmxhbmRpYW5z",
  "ZWFnbGVyY3JhZnQ=",
  "RGljaw==",
  "UHVzc3k=",
  "U2hpdAo=",
  "RGFtbgo=",
];

const swearWords = swearWordsBase64.map((word) => {
  let decodedWord = atob(word);
  let obfuscatedWord = "";
  for (let i = 0; i < decodedWord.length; i++) {
    obfuscatedWord += String.fromCharCode(decodedWord.charCodeAt(i) + 5);
  }
  return obfuscatedWord;
});

const filterSwearWords = (message) => {
  let filteredMessage = message;
  swearWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filteredMessage = filteredMessage.replace(regex, "[filtered word]");
  });
  return filteredMessage;
};

// --- HTML Interaction ---
document.getElementById("authenticateButton").addEventListener("click", async () => {
    await authenticate();
});
document.getElementById("sendButton").addEventListener("click", () => {
  const messageInput = document.getElementById("messageInput");
  sendMessage(messageInput.value);
  messageInput.value = "";
});
document.getElementById("viewOnlyButton").addEventListener("click", viewOnlyMode);
document.getElementById("rulesButton").addEventListener("click", showRules);
document.getElementById("backButton").addEventListener("click", hideRules);
