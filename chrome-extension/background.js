import { SocketManager } from './managers/SocketManager.js';
import { MessageRouter } from './routers/MessageRouter.js';

/**
 * --- BACKGROUND SERVICE WORKER ---
 * 
 * This file acts as the central "Brain" of the Chrome Extension.
 * Unlike popup.js (which dies when the menu closes) or content.js (which dies on page reload),
 * this Service Worker stays alive in the background to maintain persistent state.
 */

// 1. Initialize the Socket Manager
// This class is responsible for opening and holding the persistent WebSocket connection 
// to the Node.js backend. It handles emitting events and listening for server broadcasts.
const socketManager = new SocketManager();

// 2. Initialize the Message Router
// The extension relies heavily on internal message passing (e.g., content.js talking to background.js).
// The MessageRouter acts as the internal switchboard operator. It listens for messages from the popup or content scripts,
// and routes them to the appropriate SocketManager functions (like 'createRoom' or 'sendVideoCommand').
// The socketManager instance is passed into it so the Router knows exactly where to forward the commands.
const messageRouter = new MessageRouter(socketManager);