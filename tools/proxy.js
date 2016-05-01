'use strict';

const net = require('net');
const hexout = require('../lib/hexout');
const colors = require('colors');

const proxy = net.createServer(client => {

    const server = net.connect({ port: 3204, host: '192.168.1.114' });
    server.on('data', data => {
        console.log('Server'.green);
        hexout(data);
        client.write(data);
    });
    server.on('end', () => {
        client.end();
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
