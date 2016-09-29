'use strict';

const path = require('path');
const loadJSON = require('../util').loadJSON;

const roomDir = path.join(__dirname, '../../data/rooms');
const roomCache = new Map();

function ifNull(value, orElse) {
    // double equals, coerces undefined to null
    if (value == null) {
        return orElse;
    }
    return value;
}

class Room {
    static forUser(user) {
        return Room.loadRoom(user.sh.room);
    }

    static loadRoom(name) {
        if (!roomCache.has(name)) {
            roomCache.set(name, new Room(name));
        }
        return roomCache.get(name);
    }

    constructor(name) {
        this.name = name;
        this._data = loadJSON(path.join(roomDir, `${name}.room`));
    }

    allowsDamage() {
        return ifNull(this._data.properties.damage, true);
    }

    allowsDeath() {
        return !ifNull(this._data.properties.noDeath, false);
    }

    allowsFight() {
        return ifNull(this._data.properties.fight, true);
    }

    getAccess() {
        return ifNull(this._data.properties.access, 'public');
    }

    spawn() {
        const spawn = this._data.properties.defaultSpawn;
        let [x, y] = spawn.split(',');
        x = parseInt(x, 10);
        y = parseInt(y, 10);
        return { x, y };
    }

    editorVersion() {
        return parseInt(this._data.editor.ver, 10);
    }

    walls() {
        return this._data.walls;
    }
}

module.exports = Room;
