'use strict';

const path = require('path');
const loadJSON = require('../util').loadJSON;

const roomDir = path.join(__dirname, '../../data/rooms');

class Room {
    static forUser(user) {
        return new Room(user.sh.room);
    }

    constructor(name) {
        this.name = name;
        this._data = loadJSON(path.join(roomDir, `${name}.room`));
    }

    _undefined(value, orElse) {
        // double equals, coerces undefined to null
        if (value == null) {
            return orElse;
        }
        return value;
    }

    allowsDamage() {
        return this._undefined(this._data.properties.damage, true);
    }

    allowsDeath() {
        return !this._undefined(this._data.properties.noDeath, false);
    }

    allowsFight() {
        return this._undefined(this._data.properties.fight, true);
    }

    isPrivate() {
        return this._undefined(this._data.properties.private, false);
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
