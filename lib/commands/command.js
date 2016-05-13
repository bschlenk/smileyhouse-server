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

    pack(object, encoding) {
        return this.format.pack(object, encoding);
    }
}

module.exports = Command;
