import { createContext, useContext, useState, type ReactNode } from "react";

interface GameContextType {
    playerName: string;
    setPlayerName: (name: string) => void;
    playerCount: number;
    setPlayerCount: (count: number) => void;
    roomCode: string;
    setRoomCode: (code: string) => void;
    scenarioId: string;
    setScenarioId: (id: string) => void;
    isHost: boolean;
    setIsHost: (isHost: boolean) => void;
}

const GameContext = createContext<GameContextType>({
    playerName: "",
    setPlayerName: () => { },
    playerCount: 5,
    setPlayerCount: () => { },
    roomCode: "",
    setRoomCode: () => { },
    scenarioId: "",
    setScenarioId: () => { },
    isHost: false,
    setIsHost: () => { },
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [playerName, setPlayerName] = useState("");
    const [playerCount, setPlayerCount] = useState(5);
    const [roomCode, setRoomCode] = useState("");
    const [scenarioId, setScenarioId] = useState("");
    const [isHost, setIsHost] = useState(false);
   

    return (
        <GameContext.Provider value={{
            playerName, setPlayerName,
            playerCount, setPlayerCount,
            roomCode, setRoomCode,
            isHost, setIsHost,
            scenarioId, setScenarioId
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