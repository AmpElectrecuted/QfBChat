// WebRTC data channel text chat with codeword protection, obfuscated swear filter, rules page, and view-only mode

// --- Codeword ---
const codeword = "rhombicosidodecahedron";
let authenticated = false;
let viewOnly = false;

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

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && (authenticated || viewOnly) ) {
      // Send ICE candidates to the other peer via the signaling server
      console.log("ICE candidate sent");
      //In a real implementation, you would send this to the signaling server.
      //signalingServer.sendCandidate(otherPeerId, event.candidate);
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
  };

  dataChannel.onmessage = (event) => {
    let message = event.data;
    message = filterSwearWords(message); // Filter received message
    console.log("Received:", message);
    displayMessage("Other Peer", message);
  };

  dataChannel.onclose = () => {
    console.log("Data channel closed");
  };
};

const createOffer = async () => {
  if (!authenticated) {
    alert("Enter the codeword first.");
    return;
  }
  createPeerConnection();
  dataChannel = peerConnection.createDataChannel("chat");
  setupDataChannel();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Send the offer to the other peer via the signaling server
  console.log("Offer sent");
  //In a real implementation, you would send this to the signaling server.
  //signalingServer.sendOffer(otherPeerId, offer);

  signalingServer.registerPeer("myPeerId", offer);
};

const createAnswer = async (offer) => {
  if (!authenticated) {
    alert("Enter the codeword first.");
    return;
  }
  createPeerConnection();
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Send the answer to the other peer via the signaling server
  console.log("Answer sent");
  //In a real implementation, you would send this to the signaling server.
  //signalingServer.sendAnswer(otherPeerId, answer);
};

const setRemoteDescription = async (answer) => {
  if (!authenticated) {
    alert("Enter the codeword first.");
    return;
  }
  await peerConnection.setRemoteDescription(answer);
};

const sendMessage = (message) => {
  if (dataChannel && dataChannel.readyState === "open" && authenticated) {
    message = filterSwearWords(message); // Filter sent message
    dataChannel.send(message);
    displayMessage("You", message);
  } else if (!authenticated) {
    alert("Enter the codeword first.");
  } else {
    console.error("Data channel not open");
  }
};

const displayMessage = (sender, message) => {
  const chatLog = document.getElementById("chatLog");
  const messageElement = document.createElement("p");
  messageElement.textContent = `${sender}: ${message}`;
  chatLog.appendChild(messageElement);
};

const authenticate = () => {
  const codewordInput = document.getElementById("codewordInput").value;
  if (codewordInput === codeword) {
    authenticated = true;
    document.getElementById("codewordSection").style.display = "none";
    document.getElementById("chatSection").style.display = "block";
    document.getElementById("viewOnlySection").style.display = "none";
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
}

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
  "YW50aWJhbmxhbmRpYW5z", // antibanlandians - testing word
  "ZWFnbGVyY3JhZnQ=" // eaglercraft
];

const swearWords = swearWordsBase64.map((word) => {
  let decodedWord = atob(word);
  let obfuscatedWord = "";
  for(let i = 0; i < decodedWord.length; i++){
    obfuscatedWord += String.fromCharCode(decodedWord.charCodeAt(i) + 5); // simple cipher
  }
  return obfuscatedWord;
});

const filterSwearWords = (message) => {
  let filteredMessage = message;
  swearWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filteredMessage = filteredMessage.replace(regex, "****");
  });
  return filteredMessage;
};

// --- HTML Interaction ---

document.getElementById("authenticateButton").addEventListener("click", authenticate);
document.getElementById("offerButton").addEventListener("click", createOffer);
document.getElementById("sendButton").addEventListener("click", () => {
  const messageInput = document.getElementById("messageInput");
  sendMessage(messageInput.value);
  messageInput.value = "";
});
document.getElementById("answerButton").addEventListener("click", async () => {
    const offer = signalingServer.getPeer("otherPeerId");
    if(offer){
        await createAnswer(offer);
    }
});
document.getElementById("remoteDescriptionButton").addEventListener("click", async () => {
    const answer = signalingServer.getPeer("myPeerId");
    if(answer){
        await setRemoteDescription(answer);
    }
});
document.getElementById("viewOnlyButton").addEventListener("click", viewOnlyMode);
document.getElementById("rulesButton").addEventListener("click", showRules);
document.getElementById("backButton").addEventListener("click", hideRules);
