'use strict';

const debug = require('debug')('sh:buffer');

function getSize(val, encoding) {
    switch (val.type) {
        case 'int8': return 1;
        case 'int16': return 2;
        case 'int32': return 4;
        case 'varString': return 4 + Buffer.byteLength(val.value, encoding);
        default: return 0;
    }
}

function calcSize(fields, encoding) {
    let size = 0;
    fields.forEach(field => {
        size += getSize(field, encoding);
    });
    return size;
}

function writeBuffer(buffer, val, offset, encoding) {
    switch (val.type) {
        case 'int8':
            return buffer.writeInt8(val.value, offset);
        case 'int16':
            return buffer.writeInt16LE(val.value, offset);
        case 'int32':
            return buffer.writeInt32LE(val.value, offset);
        case 'varString':
            offset = buffer.writeInt32LE(Buffer.byteLength(val.value, encoding), offset);
            return buffer.write(val.value, offset, encoding);
        default:
            return offset;
    }
}

function readBuffer(buffer, val, object, offset) {
    let read = null;
    switch (val.type) {
        case 'int8':
            read = buffer.readInt8(offset);
            offset += 1;
            break;
        case 'int16':
            read = buffer.readInt16LE(offset);
            offset += 2;
            break;
        case 'int32':
            read = buffer.readInt32LE(offset);
            offset += 4;
            break;
        case 'varString': {
            const length = buffer.readInt32LE(offset);
            offset += 4;
            read = buffer.toString('utf-8', offset, offset + length);
            debug(`readBuffer varString got length ${length} and read ${read}`);
            offset += length;
            break;
        }
        default: return offset;
    }
    if (val.name) {
        object[val.name] = read;
    }
    return offset;
}


class BufferPacker {
    constructor() {
        this._fields = [];
        this._size = 0;
    }

    _append(type, value) {
        const val = { type, value };
        this._fields.push(val);
        this._size += getSize(val);
        return this;
    }

    int8(value) {
        return this._append('int8', value);
    }

    int16(value) {
        return this._append('int16', value);
    }

    int32(value) {
        return this._append('int32', value);
    }

    varString(value) {
        return this._append('varString', value);
    }

    pack() {
        const buff = Buffer.alloc(this._size);
        let offset = 0;

        this._fields.forEach(val => {
            offset = writeBuffer(buff, val, offset);
        });

        return buff;
    }
}

class BufferUnpacker {
    constructor() {
        this._fields = [];
    }

    _append(type, name) {
        this._fields.push({ type, name });
        return this;
    }

    int8(name) {
        return this._append('int8', name);
    }

    int16(name) {
        return this._append('int16', name);
    }

    int32(name) {
        return this._append('int32', name);
    }

    varString(name) {
        return this._append('varString', name);
    }

    unpack(buff) {
        let offset = 0;
        const object = {};

        this._fields.forEach(val => {
            offset = readBuffer(buff, val.type, object, offset);
        });

        return object;
    }
}

class BufferFormat {
    /**
     * Construct a new ``BufferFormat`` object.
     * @param  {object} defaults An object containing any default values to use
     *                           if a value is not given. Only used during packing.
     */
    constructor(defaults) {
        this._fields = [];
        this._defaults = defaults || {};
    }

    _append(type, name) {
        this._fields.push({ type, name });
        return this;
    }

    int8(name) {
        return this._append('int8', name);
    }

    int16(name) {
        return this._append('int16', name);
    }

    int32(name) {
        return this._append('int32', name);
    }

    varString(name) {
        return this._append('varString', name);
    }

    /**
     * Takes the given ``object`` and turns it into
     * the buffer described by this ``BufferFormat`` instance.
     * Note: all fields defined by this ``BufferFormat`` instance
     * must be present in the object.
     * @param  {Object<string, ?>} object Object with a key for every
     *                             field described in the ``BufferFormat``.
     * @return {Buffer} A buffer containing the keys from the object serialized
     *                  based on the ``BufferFormat`` described.
     */
    pack(object, encoding = 'utf-8') {
        const clone = Object.assign({}, this._defaults, object);
        const values = [];
        debug('packing buffer with values %j and fields %j', clone, this._fields);
        this._fields.forEach(val => {
            const type = val.type;
            const value = clone[val.name];
            values.push({ type, value });
        });
        const size = calcSize(values, encoding);

        const buff = Buffer.alloc(size);
        let offset = 0;

        values.forEach(val => {
            offset = writeBuffer(buff, val, offset, encoding);
        });

        return buff;
    }

    unpack(buff) {
        let offset = 0;
        const object = {};

        this._fields.forEach(val => {
            offset = readBuffer(buff, val, object, offset);
        });

        object._length = offset;

        return object;
    }
}

module.exports = (defaults) => new BufferFormat(defaults);
