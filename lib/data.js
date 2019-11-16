'use strict';

const request = require('request-promise-native');

require('./jar');
const Store = require('./store');

const data_store = new Store();
const history_store = new Store();

const data_qs = [
    {
        _method: 'warfish.tables.getDetails',
        sections: 'board,rules,map,continents',
    },
    {
        _method: 'warfish.tables.getState',
        sections: 'cards,board,details,players',
    },
];
const base_url = 'http://warfish.net/war/services/rest';

const findTerritory = function (data, territory_id) {
    const index = data.map.territories.findIndex(t => t.territory_id === territory_id);
    if (index === -1) {
        return null;
    }
    return data.map.territories[index];
};

const findPlayer = function (data, player_id) {
    const index = data.players.findIndex(p => p.player_id === player_id);
    if (index === -1) {
        return null;
    }
    return data.players[index];
};

const getData = async function (game_id) {
    if (data_store.has(game_id)) {
        return data_store.get(game_id);
    }
    const promises = data_qs.map(obj => {
        const qs = Object.assign({}, obj, {_format: 'json', gid: game_id});
        return request({url: base_url, qs, method: 'GET'});
    });
    const [details_json, state_json] = await Promise.all(promises);
    const raw_details = JSON.parse(details_json);
    const raw_state = JSON.parse(state_json);
    const data = {};
    data.cards = {
        sets_traded: parseInt(raw_state._content.cards.cardsetstraded, 10),
        cards_in_discard_pile: parseInt(raw_state._content.cards.numdiscard, 10),
        next_sets: raw_state._content.cards.nextcardsworth.split(',').map(x => parseInt(x, 10)),
    };
    const colors = [
        {
            color_id: 0,
            red: 138,
            green: 138,
            blue: 138,
            name: 'Grey',
        },
    ];
    for (const color of raw_details._content.map._content.color) {
        colors.push({
            color_id: parseInt(color.id, 10),
            red: parseInt(color.red, 10),
            green: parseInt(color.green, 10),
            blue: parseInt(color.blue, 10),
            name: color.name,
        });
    }
    data.players = raw_state._content.players._content.player.map((p) => {
        const player = {
            name: p.name,
            profile_id: p.profileid,
            color: colors[parseInt(p.colorid, 10)],
            is_turn: p.isturn === '1',
            is_alive: p.active === '1',
            reserve_units: parseInt(p.units, 10),
            seat_id: parseInt(p.id, 10),
            territory_ids: [],
        };
        if (p.teamid !== '-1') {
            player.team_id = parseInt(p.teamid, 10);
        }
        const card_index = raw_state._content.cards._content.player.findIndex(c => c.id === p.id);
        if (card_index !== -1) {
            player.number_of_cards = parseInt(raw_state._content.cards._content.player[card_index].num, 10);
        }
        return player;
    });

    data.rules = {};
    if (raw_details._content.rules.fog === '0') {
        data.rules.fog = 'no fog';
    } else if (raw_details._content.rules.fog === '5') {
        data.rules.fog = 'light fog';
    } else {
        data.rules.fog = 'heavy fog';
    }
    switch (raw_details._content.rules.cardscale) {
    case '4,6,8,10,4,6,8,10,4,6,8,10,4,6,8,10,4,6,8,10,4,6,8,10,4':
        data.rules.card_scale = '4-6-8-10 repeating';
        break;
    case '4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52':
        data.rules.card_scale = '4-6-8-10-12...';
        break;
    case '0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0':
        data.rules.card_scale = 'no cards';
        break;
    case '4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28':
        data.rules.card_scale = '4-5-6-7-8...';
        break;
    default:
        data.rules.card_scale = 'unknown: ' + raw_details._content.rules.cardscale;
    }
    data.rules.blind_at_once = raw_details._content.rules.baoplay === '1';
    data.rules.can_abandon_territories = raw_details._content.rules.allowabandon === '1';
    if (data.rules.can_abandon_territories) {
        data.rules.keep_possession_of_abandoned = raw_details._content.rules.keeppossession === '1';
    }
    data.rules.team_game = raw_details._content.rules.teamgame === '1';
    if (data.rules.team_game) {
        data.rules.can_team_transfer = raw_details._content.rules.teamtransfer === '1';
        data.rules.can_team_place_units = raw_details._content.rules.teamplaceunits === '1';
    }
    if (data.rules.blind_at_once) {
        data.rules.dice = 'damage dice';
        data.rules.attacker_die_goal = parseInt(raw_details._content.rules.afdie, 10);
        data.rules.defender_die_goal = parseInt(raw_details._content.rules.dfdie, 10);
        data.rules.allow_pretransfer = raw_details._content.rules.pretransfer === '1';
    } else {
        data.rules.dice = 'versus dice';
        data.rules.allow_return_to_place = raw_details._content.rules.returntoplace === '1';
        data.rules.allow_return_to_attack = raw_details._content.rules.returntoattack === '1';
    
        if (raw_details._content.rules.numattacks === '-1') {
            data.rules.attack_limit_per_turn = 'unlimited';
        } else {
            data.rules.attack_limit_per_turn = parseInt(raw_details._content.rules.numattacks, 10);
        }
        if (raw_details._content.rules.numtransfers === '-1') {
            data.rules.transfer_limit_per_turn = 'unlimited';
        } else {
            data.rules.transfer_limit_per_turn = parseInt(raw_details._content.rules.numtransfers, 10);
        }
    }
    data.rules.attacker_die = 'd' + raw_details._content.rules.adie;
    data.rules.defender_die = 'd' + raw_details._content.rules.ddie;
    if (raw_details._content.rules.numreserves !== '0') {
        data.rules.can_keep_reserve = parseInt(raw_details._content.rules.numreserves, 10);
    }

    data.map = {};
    data.map.number_of_territories = parseInt(raw_details._content.map.numterritories, 10);
    data.map.filled_numbers = raw_details._content.map.fillednumbers === '1';
    data.map.filled_areas = raw_details._content.map.fillmode === '1';
    data.map.display_name = raw_details._content.map.dispcnames === '1';
    data.map.circle_mode = raw_details._content.map.circlemode === '1';
    data.map.width = parseInt(raw_details._content.map.width, 10);
    data.map.height = parseInt(raw_details._content.map.height, 10);
    data.map.board_id = parseInt(raw_details._content.board.boardid, 10);
    data.map.territories = [];
    for (const territory of raw_details._content.map._content.territory) {
        data.map.territories.push({
            name: territory.name,
            territory_id: parseInt(territory.id, 10),
            x: parseInt(territory.x, 10),
            y: parseInt(territory.y, 10),
            text_x: parseInt(territory.textx, 10),
            text_y: parseInt(territory.texty, 10),
            can_attack_ids: [],
            will_defend_ids: [],
            player_id: null,
            units: 0.
        });
    }
    for (const border of raw_details._content.board._content.border) {
        const territory_a = findTerritory(data, parseInt(border.a, 10));
        const territory_b = findTerritory(data, parseInt(border.b, 10));
        if (territory_a && territory_b) {
            territory_a.can_attack_ids.push(territory_b.territory_id);
            territory_b.will_defend_ids.push(territory_a.territory_id);
        }
    }
    data.map.continents = [];
    for (const raw_continent of raw_details._content.continents._content.continent) {
        const continent = {
            id: parseInt(raw_continent.id, 10),
            name: raw_continent.name,
            units: parseInt(raw_continent.units, 10),
            territory_ids: [],
        };
        for (const territory_id of raw_continent.cids.split(',').map(c => parseInt(c, 10))) {
            const territory = findTerritory(data, territory_id);
            if (territory) {
                continent.territory_ids.push(territory.territory_id);
            }
        }
        data.map.continents.push(continent);
    }
    for (const area of raw_state._content.board._content.area) {
        const territory = findTerritory(data, parseInt(area.id, 10));
        const player = findPlayer(data, parseInt(area.playerid, 10));
        if (territory && player) {
            territory.player_id = player.player_id;
            territory.units = parseInt(area.units, 10);
            player.territory_ids.push(territory.territory_id);
        }
    }
    data_store.set(game_id, data);
    return data;
};

const ACTION = {
    a: 'attack',
    b: 'eliminate player bonus',
    c: 'capture territory',
    d: 'decline to join',
    e: 'eliminate player',
    f: 'transfer',
    g: 'awarded card',
    h: 'capture card(s)',
    i: 'capture reserve unit(s)',
    j: 'join game',
    k: 'seat order for BAO round',
    l: 'blind territory select',
    m: 'message',
    n: 'create new game',
    o: 'assign seat position',
    p: 'place unit(s)',
    q: 'BAO transfer',
    r: 'reshuffle cards',
    s: 'start game',
    t: 'territory select',
    u: 'use cards',
    v: 'BAO attack',
    w: 'win',
    y: 'neutral territory select',
    z: 'turn units',
    sr: 'surrender',
    bt: 'booted',
    tg: 'game terminated',
    tw: 'team win',
};

const _getHistory = async function (game_id, start) {
    const qs = {
        _method: 'warfish.tables.getHistory',
        _format: 'json',
        gid: game_id,
        start,
        num: 1500,
    };
    const json = await request({url: base_url, qs, method: 'GET'});
    const obj = JSON.parse(json);
    const history = obj._content.movelog._content.m;
    const total = parseInt(obj._content.movelog.total, 10);
    if ((start + 1500) < total) {
        const subrequest = await _getHistory(game_id, start + 1500);
        return history.concat(subrequest);
    }
    return history;
};

const maybeSetInt = function (entry, name, move, key) {
    if (move.hasOwnProperty(key)) {
        entry[name] = parseInt(move[key], 10);
    }
};

const maybeSetIntList = function (entry, name, move, key) {
    if (move.hasOwnProperty(key)) {
        entry[name] = move[key].split(',').map(v => parseInt(v, 10));
    }
};

const getHistory = async function (game_id) {
    if (history_store.has(game_id)) {
        return history_store.get(game_id);
    }

    const raw_history = await _getHistory(game_id, 0);
    const history = [];
    for (const move of raw_history) {
        const entry = {
            action: ACTION[move.a],
            move_id: parseInt(move.id, 10),
            time: new Date(parseInt(move.t, 10) * 1000),
        };
        maybeSetInt(entry, 'seat_number', move, 's');
        maybeSetInt(entry, 'country_id', move, 'cid');
        maybeSetInt(entry, 'number', move, 'num');
        maybeSetIntList(entry, 'attack_dice', move, 'ad');
        maybeSetIntList(entry, 'defend_dice', move, 'dd');
        maybeSetInt(entry, 'defender_seat_number', move, 'ds');
        maybeSetInt(entry, 'attacker_loss', move, 'al');
        maybeSetInt(entry, 'defender_loss', move, 'dl');
        maybeSetInt(entry, 'bao_order_number', move, 'oid');
        maybeSetInt(entry, 'to_country_id', move, 'tcid');
        maybeSetInt(entry, 'from_country_id', move, 'fcid');
        maybeSetInt(entry, 'eliminated_seat_number', move, 'es');
        maybeSetInt(entry, 'team_number', move, 'tid');
        maybeSetIntList(entry, 'seat_number_list', move, 'slist');
        maybeSetIntList(entry, 'captured_cards_list', move, 'clist');
        maybeSetInt(entry, 'card_id', move, 'cardid');
        history.push(entry);
    }
    history_store.set(game_id, history);
    return history;
};

module.exports  = {getData, getHistory, move_actions: Object.values(ACTION)};
