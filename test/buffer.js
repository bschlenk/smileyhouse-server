'use strict';

const assert = require('assert');
const buffer = require('../lib/buffer');

describe('buffer', () => {
    describe('#int8()', () => {
        it('should create a buffer with an 8 bit integer', () => {
            const buff = buffer()
                .int8('id')
                .pack({ id: 5 });

            const expected = new Buffer([5]);
            assert.deepEqual(expected, buff);
        });

        it('should create a buffer with a length of 1', () => {
            const buff = buffer()
                .int8('something')
                .pack({ something: 6 });

            assert.equal(1, buff.length);
        });

        it('should be chainable', () => {
            const buff = buffer()
                .int8('field1')
                .int8('field2')
                .int8('field3')
                .pack({ field1: 4, field2: 5, field3: 6 });

            assert.deepEqual(new Buffer([4, 5, 6]), buff);
        });
    });

    describe('#int16()', () => {
        it('should create a buffer with a 16 bit little endian integer', () => {
            const buff = buffer()
                .int16('id')
                .pack({ id: 1000 });

            assert.deepEqual(new Buffer([0xe8, 0x03]), buff);
        });
    });

    describe('#int32()', () => {
        it('should create a buffer with a 32 bit little endian integer', () => {
            const buff = buffer()
                .int32('id')
                .pack({ id: 543210 });

            assert.deepEqual(new Buffer([0xEA, 0x49, 0x08, 0x00]), buff);
        });
    });

    describe('#varString()', () => {
        it('should create a buffer with the string length plus the string', () => {
            const buff = buffer()
                .varString('name')
                .pack({ name: 'brian' });

            const expected = new Buffer(9);
            expected.writeInt32LE(5);
            expected.write('brian', 4);
            assert.deepEqual(expected, buff);
        });
    });

    const bufferFormat = buffer()
        .int8('field8')
        .int32('field32')
        .int16('field16')
        .varString('fieldVar');

    describe('#pack()', () => {
        it('should create a buffer using the given values', () => {
            const buff = bufferFormat.pack({
                field8: 0x0A,
                field32: 0x0ABBCCDD,
                field16: 0x0809,
                fieldVar: 'test',
            });

            const expected = new Buffer(15);
            let offset = 0;
            offset = expected.writeInt8(0x0A, offset);
            offset = expected.writeInt32LE(0x0ABBCCDD, offset);
            offset = expected.writeInt16LE(0x0809, offset);
            offset = expected.writeInt32LE(4, offset);
            offset = expected.write('test', offset);

            assert.equal(15, buff.length);
            assert.deepEqual(expected, buff);
        });
    });

    describe('#pack(ascii)', () => {
        it('should create a buffer where strings are encoded in ascii', () => {
            const format = buffer().varString('message');

            const updateMD5 = 'e76aa5975c32cfcb43695d77572fd8a7';
            const updateURL = 'http://puchisoft.com/SmileyHouse/SHCurrent/Data/';
            const message = `LOK${updateMD5}\xA4${updateURL}`;

            const buffUtf8 = format.pack({ message });
            const buffAscii = format.pack({ message }, 'ascii');

            let offset = 0;
            const expectedUtf8 = Buffer.alloc(89);
            offset = expectedUtf8.writeInt32LE(85, offset);
            offset = expectedUtf8.write(message, offset);

            assert.equal(89, buffUtf8.length);
            assert.deepEqual(expectedUtf8, buffUtf8);

            offset = 0;
            const expectedAscii = Buffer.alloc(88);
            offset = expectedAscii.writeInt32LE(84, offset);
            offset = expectedAscii.write(message, offset, 'ascii');

            assert.equal(88, buffAscii.length);
            assert.deepEqual(expectedAscii, buffAscii);
        });
    });

    describe('#unpack()', () => {
        it('should create an object from the given buffer', () => {
            const buff = new Buffer(15);
            let offset = 0;
            offset = buff.writeInt8(0x0A, offset);
            offset = buff.writeInt32LE(0x0ABBCCDD, offset);
            offset = buff.writeInt16LE(0x0809, offset);
            offset = buff.writeInt32LE(4, offset);
            offset = buff.write('test', offset);

            const object = bufferFormat.unpack(buff);

            assert.equal(0x0A, object.field8);
            assert.equal(0x0ABBCCDD, object.field32);
            assert.equal(0x0809, object.field16);
            assert.equal('test', object.fieldVar);
        });
    });
});
