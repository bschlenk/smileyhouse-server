'use strict';

const net = require('net');
const config = require('config');
const buffer = require('./buffer');
const serverCommands = require('./commands/server');
const EventEmitter = require('events').EventEmitter;
const Client = require('./client').Client;
const motd = config.get('motd');
const databaseName = config.get('database');
const database = require('./database');
const callAction = require('./actions');
const debug = require('debug')('sh:server');

function* defaultIdFactory() {
    let nextId = 1;
    for (;;) {
        yield nextId++;
    }
}

class Server extends EventEmitter {
    constructor(options) {
        super();
        const defaults = {
            idFactory: defaultIdFactory,
            databaseName,
            databaseSaveInterval: 5000,
        };
        const opts = Object.assign({}, defaults, options);
        this._idFactory = opts.idFactory();
        this._connections = new Map();
        this.setupServer();
    }

    nextId() {
        return this._idFactory.next().value;
    }

    setupServer() {
        const self = this;
        const server = net.createServer(socket => {
            const client = new Client(socket);

            client.on('message_to_server', message => {
                // OnMsgFromClient = ClientMsg;
                const name = client.name;
                debug(`client ${name} sent message: %j`, message);

                callAction(message.subchannel, client, message.message);
            });

            client.on('channel_join', message => {
                // client.OnSessionJoined = ClientSignedOn;
                console.log('channel join: %j', message);
            });

            client.on('channel_leave', message => {
                // client.OnSessionLeft = ClientSignedOff;
                console.log('channel leave: %j', message);
            });

            client.on('named', name => {

                const address = client.address();

                // Check VIP Related stuff
                const user = database.users.by('name', name);
                debug(`user %s has been named: %j`, name, user);
                if (user) {
                    const message = user.info.vip ? 'vip-do' : 'vip-nu';
                    client.sendMessage(message, 9);
                }

                // Tell client their IP
                // THE LEADING SPACE IS IMPORTANT!!
                client.sendMessage(` ${address} IP Logged!`);

                client.user = user;

                debug(`Client ${name} connected from ${address}`);

                self.clientJoined(client);
            });

            client.on('end', () => {

                const leaverName = client.name;
                const leaverId = client.id;

                debug(`client ${leaverName}(${leaverId}) disconnected`);

                if (client.user.info.loggedIn === leaverId) {
                    delete client.user.info.loggedIn;
                    debug(`${leaverName} logged out.`);

                    if (client.user.info.joined) {
                        server.broadcast(`${leaverName} left the world.`);
                        client.user.info.joined = false;
                    }

                    database.users.update(client.user);
                } else {
                    debug(`${leaverName} disconnected.`);
                }

                self.clientLeft(client);
            });

            console.log('MOTD: ', motd);

            const motdBuffer = serverCommands.MOTD.pack({ motd });
            client.write(motdBuffer);

            const id = this.nextId();
            const clientIdBuffer =
                    serverCommands.CONNECTION_ID_ASSIGNED.pack({ connection: id });

            client.id = id;
            client.write(clientIdBuffer);

            client.server = self;

            /*
            client.on('message', clientMessage);
            client.on('joined', clientSignedOn);
            client.on('left', clientSignedOff);
            client.on('end', () => {
                */
            /*
            leaverperson = GetUserThatJustLeft();
            tok = leaverperson.split("*");
            leaverName = tok[0];
            leaverId = tok[1];

            If (UserGetIniStr(leaverName, "Info", "LoggedIn") == leaverId)
            {
                UserSetIniStr(leaverName, "Info", "LoggedIn", "");
                ADDline(leaverName+" logged out.");

                If(UserGetIniStr(leaverName, "Info", "Joined") == "1")
                {
                    Server.SendText(leaverName+" left the world.");
                    UserSetIniStr(leaverName, "Info", "Joined", "");
                }
            }
            Else ADDline(leaverName+" disconnected.");

            BuildUserArray();
            UpdateUsers();
            */

        }).on('error', err => {
            throw err;
        });

        if (config.has('max-connections')) {
            const maxConnections = config.get('max-connections');
            if (maxConnections) {
                server.maxConnections = parseInt(maxConnections, 10);
            }
        }
        this._server = server;
    }

    listen(...args) {
        this._server.listen(...args);
    }

    clientJoined(client) {
        this._connections.set(client.id, client);
    }

    clientLeft(client) {
        this._connections.delete(client.id);
    }

    getClientById(id) {
        return this._connections.get(id);
    }

    getClientByName(name) {
        for (const connection of this._connections.vaues()) {
            if (connection.name === name) {
                return connection;
            }
        }
        return null;
    }

    connections() {
        return this._connections.values();
    }

    connectionCount() {
        return this._connections.size;
    }

    loggedIn() {
        return false;
    }

}

module.exports = Server;

