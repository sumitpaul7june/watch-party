import { SocketManager } from './managers/SocketManager.js';
import { MessageRouter } from './routers/MessageRouter.js';

// Boot up our background brain!
// Because this is a Service Worker, it stays alive across Netflix episodes.
const socketManager = new SocketManager();
const messageRouter = new MessageRouter(socketManager);