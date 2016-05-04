'use strict';

const Command = require('./command');
const buffer = require('../buffer');

const UNKNOWN = new Command(
    0x00,
    'unknown',
    buffer({ id: 0x00 }).int8('id')
);

const MESSAGE_TO_CHANNEL = new Command(
    0x01,
    'message_to_channel',
    buffer({ id: 0x01 })
        .int8('id')
        .int16('subchannel')
        .int32('channel')
        .varString('message')
);

const MESSAGE_TO_SERVER = new Command(
    0x02,
    'message_to_server',
    buffer({ id: 0x02 })
        .int8('id')
        .int16('subchannel')
        .varString('message')
);

const MESSAGE_TO_CONNECTION = new Command(
    0x03,
    'message_to_connection',
    buffer({ id: 0x03 })
        .int8('id')
        .int16('subchannel')
        .int32('channel')
        .int32('connectionId')
        .varString('message')
);

const CHANNEL_JOIN = new Command(
    0x04,
    'channel_join',
    buffer({ id: 0x04 })
        .int8('id')
        .varString('channelName')
);

const CHANNEL_LEAVE = new Command(
    0x05,
    'channel_leave',
    buffer({ id: 0x05 })
        .int8('id')
        .int32('channel')
);

const NAME_CHANGE = new Command(
    0x0B,
    'name_change',
    buffer({ id: 0x0B })
        .int8('id')
        .varString('name')
);

const NAME_SET = new Command(
    0x0C,
    'name_set',
    buffer({ id: 0x0C })
        .int8('id')
        .int16('subcommand')
        .varString('name')
);

module.exports = {
    commands: {
        0x00: UNKNOWN,
        0x01: MESSAGE_TO_CHANNEL,
        0x02: MESSAGE_TO_SERVER,
        0x03: MESSAGE_TO_CONNECTION,
        0x04: CHANNEL_JOIN,
        0x05: CHANNEL_LEAVE,
        0x0B: NAME_CHANGE,
        0x0C: NAME_SET,
    },
    UNKNOWN,
    MESSAGE_TO_CHANNEL,
    MESSAGE_TO_SERVER,
    MESSAGE_TO_CONNECTION,
    CHANNEL_JOIN,
    CHANNEL_LEAVE,
    NAME_CHANGE,
    NAME_SET,
};

