import { socket } from "../socket";
import { useEffect, useState } from "react";
import './ChatBox.css';

const ChatBox = ({roomId}) => {
 
    const [currentText, setCurrentText] = useState('');
    const [messages, setMessages] = useState([]);

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

        // Cleanup socket listeners on unmount
        return() => {
            socket.off('new-messages');
            socket.off('chat-history'); 
        }
    }, []);

    return(
        <div className="chat-container">
            <div className="chatMessages">
            {
                messages.map( (msg, index) => (
                    <div key={index} className={`chat-row ${msg.senderId === socket.id ? 'my-message' : 'other-message'}`}>
                        <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${msg.senderId}`} className="profile-img" alt="" />
                        <div className="message-bubble">
                            <span className="sender-name">{msg.senderName || 'Anonymous'}</span>
                            <div className="text-message">{msg.text}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="chatInput">
                <input type="text" placeholder="Enter your message" value={currentText} onChange={handleInputChange}/>
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatBox;