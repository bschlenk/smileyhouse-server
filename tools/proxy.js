'use strict';

const net = require('net');
const hexout = require('../lib/hexout');
const colors = require('colors');

const serverPort = 3204;
const serverIP = process.argv[2] || '192.168.1.114';

const proxy = net.createServer(client => {

    const server = net.connect({ port: serverPort, host: serverIP });
    server.on('data', data => {
        console.log('Server'.green);
        hexout(data);
        client.write(data);
    });
    server.on('end', () => {
        client.end();
    });
    server.on('error', (message) => {
        console.log(`error: ${message}`.red);
    });

    const address = client.address();
    console.log(`Client ${address.address}:${address.port} connected`.cyan);

    client.on('data', data => {
        console.log('Client'.cyan);
        hexout(data);
        server.write(data);
    });

    client.on('end', () => {
        console.log('* Client disconnected'.red);
        server.end();
    });

});

const port = process.env.PORT || 3205;

proxy.listen(port, () => {
    console.log(`listening on port ${port}`);
});
