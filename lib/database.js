const Loki = require('lokijs');
const config = require('config');
const dbName = config.get('database.name');
const autosaveInterval = config.get('database.autosaveInterval');
const debug = require('debug')('sh:database');


function setupCollection({ db, name, options, setup }) {
    let collection = db.getCollection(name);
    if (collection) {
        debug(`loading existing collection "${name}"`);
        return collection;
    }
    debug(`creating collection "${name}"`);
    collection = db.addCollection(name, options);
    if (setup) setup(collection);
    return collection;
}


const db = new Loki(dbName, {
    autosaveInterval,
    autosave: true,
    autoload: true,
    persistenceAdapter: 'fs',
    autoloadCallback: () => {
        db.users = setupCollection({ db, name: 'users', setup: (u) => {
            u.ensureUniqueIndex('name');
        } });
    },
});

module.exports = db;
