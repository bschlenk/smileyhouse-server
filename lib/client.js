'use strict';

const EventEmitter = require('events').EventEmitter;
const clientCommands = require('./commands/client').commands;
const serverCommands = require('./commands/server');
const buffer = require('./buffer');
const hexout = require('./hexout');
const colors = require('colors');
const debug = require('debug')('sh:client');


class Client extends EventEmitter {
    constructor(socket) {
        super();
        this._socket = socket;
        this._databuff = Buffer.alloc(0);
        this.initialize();
    }

    initialize() {
        let databuff = Buffer.alloc(0);
        const self = this;
        this._socket.on('data', function dataHandler(data) {
            databuff = Buffer.concat([databuff, data]);

            if (process.env.NODE_ENV === 'development') {
                console.log('Server <- Client'.cyan);
                hexout(data);
            }

            let command = self._nextCommand(databuff);
            if (command) {
                self.emit(command.name, command.message);
                databuff = databuff.slice(command.length);
                debug(`buffer remaining: ${databuff}`);
                if (databuff.length) {
                    dataHandler(Buffer.alloc(0));
                }
            }
        });

        this.on('name_set', (message) => {
            this.name = message.name;
            this.emit('named', this.name);
            debug(`client connected with name ${this.name} and id ${this.id}`);
        });
    }

    sendMessage(message, subChannel = 0) {
        const messageBuffer =
                serverCommands.MESSAGE.pack({ subChannel, message });

        this.write(messageBuffer);
    }

    write(buff) {
        if (process.env.NODE_ENV === 'development') {
            console.log('Server -> Client'.green);
            hexout(buff);
        }
        this._socket.write(buff);
    }

    address() {
        return this._socket.address().address;
    }

    end() {
        this._socket.end();
    }

    _nextCommand(data) {
        const type = data.readInt8(0);
        const command = clientCommands[type];
        const name = command.name;
        debug(`Received message ${command.name} from client`);
        try {
            const message = command.format.unpack(data);
            return { name, message, length: message._length };
        } catch (e) {
            debug(`command not complete: ${e}`);
            return null;
        }
    }
}


module.exports.Client = Client;
