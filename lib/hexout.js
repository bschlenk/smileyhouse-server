'use strict';

/**
 * This module holds the hexout function, used to 
 * print out a buffer as hex values along with their 
 * corresponding ascii values (as long as there is one).
 *
 * usage:
 *
 * const buffer = Buffer.alloc(9);
 * buffer.writeInt32LE(5);
 * buffer.write('hello');
 *
 * hexout(buffer);
 *
 * // output:
 * //
 * // 05 00 00 00 68 65 6C 6C 6F                      | ....hello
 * //
 * 
 */

function hexout(buffer) {
    let width = 16; // number of bytes to display per row
    // loop over the buffer width bytes at a time
    // for each byte, print as hex. then, print as ascii

    for (let i = 0; i < buffer.length; i += width) {
        let slice = buffer.slice(i, i + width);
        printHex(slice, width);
        process.stdout.write('| ');
        printAscii(slice);
        console.log(); // newline
    }
}

function printHex(buffer, width) {
    for (let val of buffer) {
        process.stdout.write(decToHex(val));
        process.stdout.write(' ');
    }
    // pad the output if necessary
    for (let i = buffer.length; i < width; ++i) {
        process.stdout.write('   ');
    }
}

function printAscii(buffer) {
    for (let val of buffer) {
        if (val < 32) {
            process.stdout.write('.');
        } else {
            process.stdout.write(String.fromCharCode(val));
        }
    }
}

function decToHex(num) {
    let hex = num.toString(16).toUpperCase();
    if (hex.length === 1) {
        hex = '0' + hex;
    }
    return hex;
}

module.exports = hexout

