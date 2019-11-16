'use strict';

const {buildSchema} = require('graphql');

const {getMap} = require('./map');
const {getData, getHistory} = require('./data');

const schema = buildSchema(`
    type Query {
        getBase64Map(game_id: Int!): String!
        getPlayers(game_id: Int!): [Player!]!
        getRules(game_id: Int!): Rules!
        getHistory(game_id: Int!, offset: Int, limit: Int): History!
    }
    type Player {
        name: String!
        profile_id: String!
        color: Color!
        is_turn: Boolean!
        is_alive: Boolean!
        reserve_units: Int!
        seat_id: Int!
        number_of_cards: Int!
        territories: [Territory!]!
        team_id: Int
    }
    type Color {
        color_id: Int!
        red: Int!
        green: Int!
        blue: Int!
        name: String!
    }
    type Rules {
        fog: String!
        card_scale: String!
        blind_at_once: Boolean!
        team_game: Boolean!
        can_team_transfer: Boolean
        can_team_place_units: Boolean
        dice: String!
        attacker_die: String!
        defender_die: String!
        attacker_die_goal: Int
        defender_die_goal: Int
        allow_pretranser: Boolean
        can_abandon_territories: Boolean!
        keep_possession_of_abandoned: Boolean
        has_unlimited_attacks: Boolean
        attack_limit_per_turn: Int
        has_unlimited_transfers: Boolean
        transfer_limit_per_turn: Int
        can_keep_in_reserve: Int
    }
    type Map {
        number_of_territories: Int!
        filled_numbers: Boolean!
        filled_areas: Boolean!
        display_names: Boolean!
        circle_mode: Boolean!
        width: Int!
        height: Int!
        board_id: Int!
        territories: [Territory!]!
        continents: [Continent!]!
    }
    type Territory {
        territory_id: Int!
        name: String!
        x: Int!
        y: Int!
        text_x: Int!
        text_y: Int!
        player: Player
        units: Int!
        can_attack: [Territory!]!
        will_defend: [Territory!]!
    }
    type Continent {
        continent_id: Int!
        name: String!
        units: Int!
        territories: [Territory!]!
    }
    type History {
        moves: [Move!]!
    }
    type Move {
        move_id: Int!
        action: String!
        time: String!
        player: Player
        territory: Territory
        number: Int
        attack_dice: [Int!]
        defend_dice: [Int!]
        defender_seat_id: Int
        attacker_loss: Int
        defender_loss: Int
        bao_order_number: Int
        to_territory: Territory
        from_territory: Territory
        eliminated_player: Player
        team_id: Int
        players: [Player!]
        captured_card_ids: [Int!]
        card_id: Int
    }
`);

const root = {
    getBase64Map: async (args) => {
        const map = await getMap(args.game_id);
        return map.getBase64Async(Jimp.MIME_PNG);
    },
    getPlayers: async (args) => {
        const data = await getData(args.game_id);
        return data.players;
    },
    getRules: async (args) => {
        const data = await getData(args.game_id);
        return data.rules;
    },
    getHistory: async (args) => {
        let moves = await getHistory(args.game_id);
        if (args.offset) {
            moves = moves.slice(args.offset);
        }
        if (args.limit) {
            moves.length = Math.min(moves.length, args.limit);
        }
        return {moves};
    },
};

module.exports = {schema, root};
