'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const Room = require('../../lib/models/room');

describe('Room', () => {

    describe('#fromUser', () => {
        it('should create a Room object from a User', () => {
            const user = {
                sh: {
                    room: 'BunnyDungeon1'
                }
            };

            const room = Room.forUser(user);
            assert.equal('BunnyDungeon1', room.name);
        });
    });

    describe('#constructor', () => {
        it('should create a new Room object', () => {
            const room = new Room('BunnyDungeon15');
            assert.ok(room.allowsDamage());
            assert.ok(room.allowsFight());
            assert.ok(room.allowsDeath());
            assert.ok(!room.isPrivate());

            assert.deepEqual(room.spawn(), { x: 68, y: 344 });
            assert.equal(room.editorVersion(), '107');

            assert.equal(room.walls().length, 5);
        });
    });

    describe('#loadRoom', () => {
        const util = require('../../lib/util');
        const loadJSON = sinon.spy(util, 'loadJSON');
        const Room = proxyquire('../../lib/models/room', { loadJSON });

        it('should cache the result', () => {
            const room1 = Room.loadRoom('BunnyDungeon15');
            const room2 = Room.loadRoom('BunnyDungeon15');
            const room3 = Room.loadRoom('BunnyDungeon15');
            const room4 = Room.loadRoom('BunnyDungeon15');
            const room5 = Room.loadRoom('BunnyDungeon15');

            assert(loadJSON.calledOnce);
        });
    })
});
