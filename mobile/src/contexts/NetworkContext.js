import React, { createContext, useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { FORCE_OFFLINE_MODE, DEBUG_MODE } from "../config/env";

export const NetworkContext = createContext({
  isConnected: !FORCE_OFFLINE_MODE,
  type: null,
  details: null,
});

export function NetworkProvider({ children }) {
  const [isConnected, setIsConnected] = useState(!FORCE_OFFLINE_MODE);
  const [networkType, setNetworkType] = useState(null);
  const [networkDetails, setNetworkDetails] = useState(null);

  useEffect(() => {
    // Initial network check
    (async () => {
      try {
        const state = await NetInfo.fetch();
        if (!FORCE_OFFLINE_MODE) {
          setIsConnected(state.isConnected);
          setNetworkType(state.type);
          setNetworkDetails(state.details);

          if (DEBUG_MODE) {
            console.log("Initial network state:", {
              isConnected: state.isConnected,
              type: state.type,
              details: state.details,
            });
          }
        }
      } catch (error) {
        console.error("Error checking network:", error);
      }
    })();

    // If we're forcing offline mode, don't bother checking network status
    if (FORCE_OFFLINE_MODE) {
      setIsConnected(false);
      return;
    }

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
      setNetworkDetails(state.details);

      if (DEBUG_MODE) {
        console.log("Network state changed:", {
          isConnected: state.isConnected,
          type: state.type,
          details: state.details,
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        type: networkType,
        details: networkDetails,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
