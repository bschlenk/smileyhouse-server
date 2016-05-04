'use strict';

const Command = require('./command');
const buffer = require('../buffer');

const MESSAGE = new Command(
    0x01,
    'message',
    buffer({ id: 0x01, channel: 0, sourceChannel: 0 })
        .int8('id')
        .int16('subChannel')
        .int32('channel')
        .int32('sourceChannel')
        .varString('message')
);

const CONNECTION_LEFT = new Command(
    0x05,
    'connection_left',
    buffer({ id: 0x05 })
        .int8('id')
        .int32('connection')
        .int32('channel')
        .int32('masterConnection')
);

const CONNECTION_JOINED = new Command(
    0x06,
    'connection_joined',
    buffer({ id: 0x06 })
        .int8('id')
        .int32('connection')
        .int32('channel')
        .int32('masterConnection')
        .varString('connectionName')
        .varString('connectionAddress')
);

const CONNECTION_DETAILS = new Command(
    0x07,
    'connection_details',
    buffer({ id: 0x07 })
        .int8('id')
        .int32('connection')
        .int32('channel')
        .int32('masterConnection')
        .varString('connectionName')
        .varString('connectionAddress')
);

const CHANNEL_JOIN_DETAILS = new Command(
    0x08,
    'channel_join_details',
    buffer({ id: 0x08 })
        .int8('id')
        .int32('connection')
        .int32('channel')
        .int32('masterConnection')
        .varString('connectionName')
        .varString('address')
        .varString('channelName')
);

const MOTD = new Command(
    0x0A,
    'motd',
    buffer({ id: 0x0A })
        .int8('id')
        .varString('motd')
);

const CONNECTION_NAME_CHANGED = new Command(
    0x0B,
    'connection_name_changed',
    buffer({ id: 0x0B })
        .int8('id')
        .int32('connection')
        .varString('name')
);

const CONNECTION_ID_ASSIGNED = new Command(
    0x0C,
    'connection_id_assigned',
    buffer({ id: 0x0C, pad: 0x0003 })
        .int8('id')
        .int16('pad')
        .int32('connection')
);

module.exports = {
    commands: {
        0x01: MESSAGE,
        0x05: CONNECTION_LEFT,
        0x06: CONNECTION_JOINED,
        0x07: CONNECTION_DETAILS,
        0x08: CHANNEL_JOIN_DETAILS,
        0x0A: MOTD,
        0x0B: CONNECTION_NAME_CHANGED,
        0x0C: CONNECTION_ID_ASSIGNED,
    },
    MESSAGE,
    CONNECTION_LEFT,
    CONNECTION_JOINED,
    CONNECTION_DETAILS,
    CHANNEL_JOIN_DETAILS,
    MOTD,
    CONNECTION_NAME_CHANGED,
    CONNECTION_ID_ASSIGNED,
};

