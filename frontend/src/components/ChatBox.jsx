import { socket } from "../socket";
import { useEffect, useState } from "react";
import './ChatBox.css';

const ChatBox = ({roomId}) => {
 
    const [currentText, setCurrentText] = useState('');
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState(1);

    const handleInputChange = (e) => {
        setCurrentText(e.target.value);
    }

    const handleSendMessage = () => {
        if(currentText.trim() !== '')
        {
            // Transmit message payload to the server
            socket.emit('chat-message', {roomId, currentText});
            setCurrentText('');
        }
    }

     useEffect(() => {
        // Listen for incoming live messages
        socket.on('new-messages', (incomingMessage) => {
            setMessages((prevMessages) => [...prevMessages, incomingMessage]);
        });

        // Initialize state with room chat history on join
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
            <div className="chat-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Room Chat</span>
                    <span style={{ fontSize: '12px', background: 'var(--glass-border)', padding: '2px 8px', borderRadius: '12px' }}>
                        {participants} <span style={{ color: 'var(--text-muted)' }}>👤</span>
                    </span>
                </div>
                <button 
                    className="btn-secondary" 
                    style={{ padding: '4px 12px', fontSize: '12px', width: 'auto' }}
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
                    if (msg.type === 'system') {
                        return (
                            <div key={index} className="chat-row system-message">
                                <div className="system-bubble">
                                    {msg.senderName} {msg.text}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={index} className={`chat-row ${msg.senderId === socket.id ? 'my-message' : 'other-message'}`}>
                            <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${msg.senderId}`} className="profile-img" alt="" />
                            <div className="message-bubble">
                                <span className="sender-name">{msg.senderName || 'Anonymous'}</span>
                                <div className="text-message">{msg.text}</div>
                            </div>
                        </div>
                    );
                })
            }
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