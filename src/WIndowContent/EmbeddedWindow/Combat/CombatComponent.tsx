import React from 'react';
import { MonsterEffectFunctionTemplate } from '../../../Models/Fighter/Ability/MonsterAbilityContainer';
import { PlayerActivity } from '../../../Models/Fighter/Player';
import { GlobalGameStore, __GLOBAL_GAME_STORE } from '../../../Models/GlobalGameStore';
import { getRandomElement, getRandomValueUpTo } from '../../../Models/Helper';
import { __GLOBAL_REFRESH_FUNC_REF } from '../../../Pages/PlayPage';
import { ConsoleData } from '../../Console/ConsoleComponent';
import LootTransitionComponent from './LootTransitionComponent';
import { PlayerAbilityEffectLib } from '../../../Models/Shared/EffectLib/PlayerAbilityEffectLib';

export interface CustomDamageMessage {
    insertDamage: boolean;
    str1: string;
    str2?: string;
}

function getCustomDamageMessage(customDamageMessage: CustomDamageMessage, damage: number) {
    return customDamageMessage.str1 + damage + customDamageMessage.str2;
}

function displayMessage(damage: number, consoleData: ConsoleData, customMessage?: CustomDamageMessage | null) {
    if (customMessage !== undefined && customMessage !== null) {
        let finalMsg = '';

        if (customMessage.insertDamage) {
            finalMsg = getCustomDamageMessage(customMessage, damage);
        } else {
            finalMsg = customMessage.str1;
        }

        consoleData.add(finalMsg);
    } else {
        consoleData.add('You perform a basic attack for ' + damage + ' damage.');
    }
}

export function processCombatRound(store: GlobalGameStore, customMessage?: CustomDamageMessage | null) {
    let player = store.player;
    let enemy = store.enemy;
    let consoleData = store.consoleData;
    let combatState = store.combatState;

    // var init
    let playerDead = false;
    let enemyDead = false;
    let playerArmor = player.getArmor();
    let enemyArmor = enemy.getArmor();

    /**
     * Damage Calcs
     */

    let playerDamage = player.getRandomDamageValue() - enemyArmor;
    let enemyDamage = enemy.getRandomDamageValue() - playerArmor;

    // Cap damage to 0 minimum.
    if (playerDamage < 0) {
        playerDamage = 0;
    }

    if (enemyDamage < 0) {
        enemyDamage = 0;
    }

    /**
     * Execute Player attack.
     */

    // If player has skip turn status, skip over damage portion entirely.
    if (!player.statusContainer.hasSkipTurnStatus()) {
        enemy.statBlock.healthMin -= playerDamage;
    }

    displayMessage(playerDamage, consoleData, customMessage);

    // If enemy died, then handle enemy death.
    if (enemy.statBlock.healthMin <= 0) {
        enemyDead = true;
        consoleData.add('Enemy died.');
        player.gold += enemy.gold;
        player.giveExperience(enemy, consoleData);
        player.setLooting();

        // Generate loot.
        combatState.generateNewLoot();

        // End combat if no loot, else show loot screen.
        if (combatState.loot.length === 0) {
            player.setCombatOver();
        } else {
            player.setLooting();
        }
    }

    // If the enemy isn't dead, handle monster attack.
    if (!enemyDead) {
        // If there are any abilities, roll 25% chance to use it.
        let enemyAbilities: Array<MonsterEffectFunctionTemplate> = enemy.abilities.abilityArray;
        let usedAbility = false;

        if (enemyAbilities.length > 0) {
            let abilityUseChance = getRandomValueUpTo(4); // 20% chance.

            if (abilityUseChance === 0) {
                usedAbility = true;
                let doAbility: MonsterEffectFunctionTemplate = getRandomElement(enemyAbilities);

                // Do the ability.
                doAbility(enemy, player, combatState, consoleData);
            }
        }

        // Otherwise, do basic attack.
        if (!usedAbility) {
            player.statBlock.healthMin -= enemyDamage;
            consoleData.add(enemy.name + ' hits you for ' + enemyDamage + ' damage.');
        }
    }

    // If Player died, handle player death.
    if (player.statBlock.healthMin <= 0) {
        playerDead = true;

        consoleData.add('You died, but a passing Cleric revived you at full life. (Nice!)');

        // Heal and clear statuses.
        player.statBlock.healthMin = player.statBlock.healthMax;
        player.statusContainer.clear();

        // Reset combat state.
        player.setCombatOver();
    }

    // Process status effects.
    if (!playerDead) {
        player.statusContainer.reduceStatusTurns();
    }

    if (!enemyDead) {
        enemy.statusContainer.reduceStatusTurns();
    }

    // Refresh!
    __GLOBAL_REFRESH_FUNC_REF();
}

export default function CombatComponent(): JSX.Element {
    let store: GlobalGameStore = __GLOBAL_GAME_STORE((__DATA) => __DATA);
    let player = store.player;
    let enemy = store.enemy;
    let display;

    switch (player.activity) {
        case PlayerActivity.IN_COMBAT_FIGHTING:
            display = (
                <div>
                    <h1>
                        {player.name} vs. {enemy.name}
                    </h1>
                    <p>
                        {player.statBlock.healthMin} vs. {enemy.statBlock.healthMin}
                    </p>
                    <button
                        onClick={() => {
                            processCombatRound(store);
                        }}
                    >
                        Attack
                    </button>
                    <button
                        onClick={() => {
                            // Use 'defense ability'.
                            PlayerAbilityEffectLib.defend(store);
                        }}
                    >
                        Defend
                    </button>
                    <button
                        onClick={() => {
                            PlayerAbilityEffectLib.flee(store);
                        }}
                    >
                        Flee
                    </button>
                </div>
            );
            break;
        case PlayerActivity.IN_COMBAT_LOOTING:
            display = <LootTransitionComponent />;
            break;
        default:
            display = <div></div>;
    }

    return <div className="combat-window">{display}</div>;
}
