import React, { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket/socket";

export const NotificationContext = createContext();

// Custom hook to use notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        // Load notifications from localStorage on mount
        const savedNotifications = localStorage.getItem('notifications');
        return savedNotifications ? JSON.parse(savedNotifications) : [];
    });
    const userId = localStorage.getItem("userId");

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (userId) {

            socket.emit("joinRoom", userId);


            socket.on("notification", (data) => {
                setNotifications((prev) => [data, ...prev]);
            });
        }


        return () => {
            socket.off("notification");
        };
    }, [userId]);

    return (
        <NotificationContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
