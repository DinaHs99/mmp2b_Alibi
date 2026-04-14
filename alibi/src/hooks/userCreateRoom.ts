import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { generateRoomCode } from "../lib/roomUtils";

export const userCreateRoom = () => {
    const navigate = useNavigate();
    const { playerName, playerCount, scenarioId, setRoomCode, setIsHost } = useGame()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const createRoom = async (scenarioIdParam?: string) => {
        const finalScenarioId = scenarioIdParam || scenarioId
        //debug
        console.log("createRoom", playerName, playerCount, finalScenarioId)
        if(!playerName || !playerCount || !finalScenarioId){
            setError("Missing player name, player count, or scenario ID");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const code = generateRoomCode()
            console.log('Generated code:', code)

            // Create room
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .insert({
                code,
                phase: 'lobby',
                round: 1,
                scenario_id: scenarioIdParam,
                player_count: playerCount,
                })
                .select()
                .single()

            if (roomError) {
                console.error('Room insert error:', roomError)
                throw roomError
            }

            console.log('Room created:', room)

            
            const sessionId = crypto.randomUUID()
            localStorage.setItem('alibi_session_id', sessionId)

            const { error: playerError } = await supabase
                .from('players')
                .insert({
                room_id: room.id,
                fake_name: playerName,
                is_host: true,
                status: 'alive',
                session_id: sessionId,
                })

            if (playerError) {
                console.error('Player insert error:', playerError)
                throw playerError
            }

            console.log('Player created successfully')

            setRoomCode(code)
            setIsHost(true)
            navigate(`/room/${code}`)

            sessionStorage.setItem('alibi_session_id', sessionId)
            sessionStorage.setItem('alibi_player_name', playerName)
            localStorage.setItem('alibi_room_code', code)
            sessionStorage.setItem('alibi_is_host', 'true')

            } catch (err) {
            console.error('Create room failed:', err)
            setError('Failed to create room. Try again.')
            } finally {
            setLoading(false)
            }
            }

            return { createRoom, loading, error }
        }