/**
 * Our play page represents the game window that the player sees after exiting the intro.
 * It is the focal point for all other windows and player interactions.
 */

import React, { useEffect } from 'react';
import FloatingWindow from '../Components/FloatingWindow/FloatingWindow';
import Character from '../WIndowContent/Character/Character';
import Combat from '../WIndowContent/Combat/Combat';
import { PageProps } from './SharedProps/PageBaseProps';
import Inventory from '../WIndowContent/Inventory/Inventory';
import Equipment from '../WIndowContent/Equipment/Equipment';
import Console from '../WIndowContent/Console/Console';
import Cheat from '../WIndowContent/Cheat/Cheat';
import WindowStateManager from '../Models/Singles/WindowStateManager';
import { __GLOBAL_GAME_STORE } from '../Models/GlobalGameStore';

export let __GLOBAL_REFRESH_FUNC_REF: Function;

const rowMod = 3;
const topInterval = 320;
const topIntervalDivisor = topInterval * rowMod;
const leftInterval = 450;

export interface FloatingWindowPropsBuilder {
    id?: number;
    title: string;
    contentElement: JSX.Element;
    top?: number;
    left?: number;
}

interface PosData {
    data: number;
}

/**
 * Creates a final window object by calculating the top and left properties of a 'win' argument. Then, adds to our finalWindows array.
 */
function getWindowObject(pos: PosData, win: FloatingWindowPropsBuilder) {
    const p = pos.data;
    const topCellLayoutMod =
        topInterval * Math.floor((topInterval * p) / topIntervalDivisor);
    const topCellResetMod = Math.floor(p / 9) * 50;
    win['top'] =
        150 + (topCellLayoutMod % topIntervalDivisor) + topCellResetMod;
    win['left'] = 60 + leftInterval * (p % rowMod);
    pos.data++;
}

/**
 *  Use our setPage function to change game page back to intro.
 */
function openIntroPage(props: PageProps) {
    props.setPage(0);
}

/**
 * Builds and returns our array of window content to display on the page.
 */
function getWindows(pos: PosData, windowStateManager: WindowStateManager) {
    let windows: Array<FloatingWindowPropsBuilder> = [
        {
            title: 'Player',
            contentElement: <Character usePlayer={true} />,
        },
        {
            title: 'Combat',
            contentElement: <Combat />,
        },
        {
            title: 'Enemy',
            contentElement: <Character usePlayer={false} />,
        },
        {
            title: 'Equipment',
            contentElement: <Equipment usePlayer={true} />,
        },
        {
            title: 'Inventory',
            contentElement: <Inventory usePlayer={true} />,
        },
        {
            title: 'Console',
            contentElement: <Console />,
        },
        {
            title: 'Cheat',
            contentElement: <Cheat />,
        },
    ];

    // Calculate window positions and add to window objects.
    let c: number = 0;

    for (let win of windows) {
        win.id = c;

        if (windowStateManager.isFree(c)) {
            getWindowObject(pos, win);
            windowStateManager.subscribe(win.id, win);
        }

        c++;
    }

    // Create list of windows to display on page.
    // Flex our skills a bit by using the 'as' keyword to convert our windows object to correct type.
    return windows.map((v: FloatingWindowPropsBuilder, i: number) => {
        return (
            <div key={i}>
                <FloatingWindow id={i} contentElement={v.contentElement} />
            </div>
        );
    });
}

function forceRefresh(setRefreshVar: Function) {
    setRefreshVar((v: number) => v + 1);
}

export function PlayPage(props: PageProps) {
    // var inits
    let pos: PosData = { data: 0 }; // don't set as ref or state, no need for fancy integrations.
    const [refreshVar, setRefreshVar] = React.useState(0);
    __GLOBAL_REFRESH_FUNC_REF = () => {
        forceRefresh(setRefreshVar);
    };
    let windowStateManager: WindowStateManager = __GLOBAL_GAME_STORE(
        (__DATA: any) => __DATA.windowStateManager,
    );

    return (
        <div>
            <div>
                <h1>Loot Quest</h1>
                <button
                    onClick={() => {
                        windowStateManager.resetWindows();
                        __GLOBAL_REFRESH_FUNC_REF();
                    }}
                >
                    Reset Windows
                </button>
                <button
                    onClick={() => {
                        openIntroPage(props);
                    }}
                >
                    Quit
                </button>
                Window Transparency
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={windowStateManager.opacity * 100}
                    onChange={(e: any) => {
                        windowStateManager.opacity = e.target.value * 0.01;
                        __GLOBAL_REFRESH_FUNC_REF();
                    }}
                />
            </div>

            <div id="floating-window-container" key={refreshVar}>
                {getWindows(pos, windowStateManager)}
            </div>
        </div>
    );
}
