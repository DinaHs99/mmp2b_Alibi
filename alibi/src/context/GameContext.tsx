import { createContext, useContext, useState, type ReactNode } from "react";

interface GameContextType {
    playerName: string;
    setPlayerName: (name: string) => void;
    playerCount: number;
    setPlayerCount: (count: number) => void;
    roomCode: string;
    setRoomCode: (code: string) => void;
    isHost: boolean;
    setIsHost: (isHost: boolean) => void;
    isReady: boolean;
    setIsReady: (isReady: boolean) => void;
    isStarted: boolean;
    setIsStarted: (isStarted: boolean) => void;
}

const GameContext = createContext<GameContextType>({
    playerName: "",
    setPlayerName: () => {},
    playerCount: 0,
    setPlayerCount: () => {},
    roomCode: "",
    setRoomCode: () => {},

    isHost: false,
    setIsHost: () => {},
    isReady: false,
    setIsReady: () => {},
    isStarted: false,
    setIsStarted: () => {},
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [playerName, setPlayerName] = useState("");
    const [playerCount, setPlayerCount] = useState(5);
    const [roomCode, setRoomCode] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isStarted, setIsStarted] = useState(false);

    return (
        <GameContext.Provider value={{
            playerName, setPlayerName,
            playerCount, setPlayerCount,
            roomCode, setRoomCode,
            isHost, setIsHost,
            isReady, setIsReady,
            isStarted, setIsStarted
        }}>
            {children}
        </GameContext.Provider>
    )
}

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}