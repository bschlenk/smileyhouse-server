'use strict';

const pkg = require('./package.json');
const Server = require('./lib/server');
const config = require('config');
const colors = require('colors');
const PORT = config.get('port');

const banner = `\
###################################################
#                                                 #
#             Smiley House ${pkg.version}                  #
#                                                 #
###################################################

`.yellow;

console.log(banner);

const server = new Server();
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
