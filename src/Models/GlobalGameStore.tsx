import create from 'zustand';
import { ConsoleData } from '../WIndowContent/Console/Console';
import { Player } from './Fighter/Player';
import { Monster } from './Fighter/Monster';
import CombatState from './Shared/CombatState';
import WindowStateManager from './Singles/WindowStateManager';
import produce from 'immer';

function getGameStore() {
    return create((set) => ({
        player: new Player(),
        enemy: new Monster(),
        combatState: new CombatState(),
        consoleData: new ConsoleData(),
        windowStateManager: new WindowStateManager(),

        setPlayerName: (x: string) =>
            set(
                produce((state: any) => {
                    state.player.name = x;
                }),
            ),
    }));
}

export function G_RESET_GAME_STORE() {
    __GLOBAL_GAME_STORE = getGameStore();
}

export let __GLOBAL_GAME_STORE = getGameStore();
