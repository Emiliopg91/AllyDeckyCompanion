import { useEffect, useState } from "react";
import { State } from '../utils/state'
import { Game } from 'decky-plugin-framework'
import { Constants } from "../utils/constants";

export const useProfile = () => {
    const [id, setId] = useState(State.RUNNING_GAME_ID);
    const [name, setName] = useState(State.RUNNING_GAME_ID == Constants.DEFAULT_ID ? Constants.DEFAULT_NAME : Game.getGameDetails(Number(State.RUNNING_GAME_ID)).getDisplayName());

    useEffect(() => {
        setId(State.RUNNING_GAME_ID)
        if (State.RUNNING_GAME_ID === Constants.DEFAULT_ID) { setName(Constants.DEFAULT_NAME) } else {
            setName(Game.getGameDetails(Number(State.RUNNING_GAME_ID)).getDisplayName());
        }
    }, [State.RUNNING_GAME_ID]);


    return [id, name]
};
