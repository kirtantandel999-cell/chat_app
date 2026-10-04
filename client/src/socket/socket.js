import { io } from "socket.io-client";

export const createSocket = (token) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "/";

  return io(socketUrl, {
    auth: {
      token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
};

export default createSocket;
