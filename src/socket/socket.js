import { io } from "socket.io-client";

// Use HTTPS since your backend is now secured
// You can also use environment variable for flexibility
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://localhost:3000";

const socket = io(SOCKET_URL, {
    transports: ["websocket"],       // Prefer WebSocket for performance
    secure: true,                    // Required for HTTPS / SSL
    rejectUnauthorized: false,       // Accept self-signed certificate
    withCredentials: true,           // Send cookies (JWT in HTTP-only cookie)
    auth: {
        // If backend validates via cookies, nothing needed here
        // Leave empty for HTTP-only cookie-based auth
    }
});

// ---------------- Socket Events ----------------
socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO server:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from Socket.IO server:", reason);
});

socket.on("connect_error", (err) => {
    console.error("⚠️ Socket.IO connection error:", err.message);
});

export default socket;
