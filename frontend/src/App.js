import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("https://realtime-chat-app-plp7.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const joinRoom = () => {
    if (username && room) {
      socket.emit("joinRoom", { username, room });
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("users", (data) => {
      setUsers(data);
    });

    socket.on("typing", (data) => {
      setMessages((prev) => [
        ...prev,
        { user: "System", text: `${data.user} is typing...` }
      ]);
    });
  }, []);

  if (!joined) {
    return (
      <div className="join">
        <h2>Join Chat</h2>
        <input placeholder="Name" onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Room" onChange={(e) => setRoom(e.target.value)} />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div className="container">
      
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Users</h3>
        {users.map((u, i) => (
          <div key={i} className="user">
            🟢 {u.username}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="chat">
        
        <div className="messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.user === username ? "message own" : "message"
              }
            >
              <b>{msg.user}</b>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        <div className="inputBox">
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing");
            }}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;