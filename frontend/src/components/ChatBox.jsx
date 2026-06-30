import { socket } from "../socket";
import { useEffect, useState, useRef } from "react";
import './ChatBox.css';

/**
 * ChatBox Component
 * 
 * I built this component to handle real-time text communication between users in the same room.
 * It manages the local input state, displays incoming messages and system alerts (like joins/leaves),
 * and automatically scrolls to the newest message.
 * 
 * @param {string} roomId - The ID of the room the chat is bound to.
 */
const ChatBox = ({roomId}) => {
 
    // State to hold the user's current typed message
    const [currentText, setCurrentText] = useState('');
    
    // State to store the array of all chat messages (both historical and live)
    const [messages, setMessages] = useState([]);
    
    // State to track how many people are currently in the room
    const [participants, setParticipants] = useState(1);
    
    // I use this ref to automatically scroll to the bottom of the chat list
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Whenever a new message is added, trigger the scroll-to-bottom effect
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleInputChange = (e) => {
        setCurrentText(e.target.value);
    }

    const handleSendMessage = () => {
        if(currentText.trim() !== '')
        {
            // I transmit the message payload to the server via Socket.io
            socket.emit('chat-message', {roomId, currentText});
            setCurrentText('');
        }
    }

     useEffect(() => {
        // Listen for incoming live text messages from other users
        socket.on('new-messages', (incomingMessage) => {
            setMessages((prevMessages) => [...prevMessages, incomingMessage]);
        });

        // Initialize state with the room's entire chat history upon joining
        socket.on('chat-history', (historyArray) => {
            setMessages(historyArray);
        });

        // Listen for participant count updates
        socket.on('room-update', (data) => {
            setParticipants(data.count);
        });

        // Cleanup socket listeners on unmount
        return() => {
            socket.off('new-messages');
            socket.off('chat-history'); 
            socket.off('room-update');
        }
    }, []);

    return(
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-title-group">
                    <span>Room Chat</span>
                    <span className="participant-count">
                        {participants} <span className="participant-icon">👤</span>
                    </span>
                </div>
                <button 
                    className="btn-secondary btn-copy-code"
                    onClick={() => {
                        navigator.clipboard.writeText(roomId);
                        alert("Room Code Copied: " + roomId);
                    }}
                    title="Click to copy Room Code"
                >
                    Copy Code: {roomId}
                </button>
            </div>
            <div className="chatMessages">
            {
                messages.map( (msg, index) => {
                    return (
                        <div key={index} className={`chat-row ${msg.senderId === socket.id ? 'my-message' : 'other-message'} ${msg.type === 'system' ? 'system-row' : ''}`}>
                            <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${msg.senderId}`} className="profile-img" alt="" />
                            <div className="message-bubble">
                                <span className="sender-name">{msg.senderName || 'Anonymous'}</span>
                                <div className="text-message" style={msg.type === 'system' ? { fontStyle: 'italic', opacity: 0.8 } : {}}>{msg.text}</div>
                            </div>
                        </div>
                    );
                })
            }
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chatInput">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={currentText} 
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="btn-send" onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatBox;