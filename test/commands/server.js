'use strict';

const assert = require('assert');
const commands = require('../../lib/commands/server');

describe('server_commands', () => {
    describe('connection_id_assigned', () => {
        it('should create a buffer with a connection id configured', () => {
            const connection = 500;
            const buff = commands.CONNECTION_ID_ASSIGNED.pack({ connection });

            const expected = Buffer.alloc(7);
            expected.writeInt8(0x0C);
            expected.writeInt16LE(0x0003, 1);
            expected.writeInt32LE(connection, 3);

            assert.deepEqual(expected, buff);
        });
    });
});
