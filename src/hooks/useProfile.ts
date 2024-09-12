import { useEffect, useState } from "react";
import { State } from '../utils/state'
import { Game, Translator } from 'decky-plugin-framework'
import { Constants } from "../utils/constants";

export const useProfile = () => {
    const [id, setId] = useState(State.RUNNING_GAME_ID);
    const [name, setName] = useState(State.RUNNING_GAME_ID == Constants.DEFAULT_ID ? Translator.translate("main.menu") : Game.getGameDetails(Number(State.RUNNING_GAME_ID)).getDisplayName());

    useEffect(() => {
        setId(State.RUNNING_GAME_ID)
        if (State.RUNNING_GAME_ID === Constants.DEFAULT_ID) { setName(Translator.translate("main.menu")) } else {
            setName(Game.getGameDetails(Number(State.RUNNING_GAME_ID)).getDisplayName());
        }
    }, [State.RUNNING_GAME_ID]);


    return [id, name]
};
