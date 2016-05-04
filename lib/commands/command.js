'use strict';

class Command {
    constructor(id, name, format) {
        this.id = id;
        this.name = name;
        this.format = format;
    }

    unpack(buff) {
        return this.format.unpack(buff);
    }

    pack(object) {
        return this.format.pack(object);
    }
}

module.exports = Command;
