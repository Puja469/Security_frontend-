import React, { createContext, useState } from "react";

export const InfoContext = createContext();

export const InfoProvider = ({ children }) => {
  const [info, setInfo] = useState(() => {
    const storedRole = localStorage.getItem("role") || "";
    return { details: "", role: storedRole };
  });

  return (
    <InfoContext.Provider value={{ info, setInfo }}>
      {children}
    </InfoContext.Provider>
  );
};
