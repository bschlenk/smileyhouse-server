'use strict';

let net = require('net');

function main() {
    let proxy = net.createServer(client => {

        let server = net.connect({port: 3204, host: '192.168.1.114'});
        server.on('data', data => {
            console.log('Server');
            hexout(data);
            client.write(data);
        });
        server.on('end', () => {
            client.end();
        });

        let address = client.address();
        console.log(`client ${address.address}.${address.port} joined!`);

        client.on('data', data => {
            console.log('Client');
            hexout(data);
            server.write(data);
        });

        client.on('end', () => {
            console.log('client has logged off');
            server.end();
        });

    });

    let port = 3205;
    proxy.listen(port, () => {
        console.log(`listening on port ${port}`);
    });
}

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


if (require.main === module) {
    main();
}
