'use strict';

const debug = require('debug')('sh:actions');
const database = require('./database');
const bcrypt = require('bcrypt-nodejs');
const util = require('./util');

const actions = {};

function setAction(subchannel, func, requiresAuth = true) {
    let wrapped = func;
    if (requiresAuth) {
        wrapped = (client, message) => {
            if (client.loggedIn()) {
                func(client, message);
            } else {
                client.end();
            }
        };
    }
    actions[subchannel] = wrapped;
}


/**
 * Misc stuff for anonymous users
 * @param {[type]} client  [description]
 * @param {[type]} message [description]
 */
function SHPreLogin(client, message) {
    const name = client.name;
    const [part1, part2] = message.split(' ');

    debug('received prelogin from ${name}: ${message}');

    switch (part1) {
        case 'mailpass':
            // TODO: no SHMailPass.exe... figure this out
            debug('PreLogin: ${client.address()} requested password (email)');
            client.sendMessage('mailsent', 1);
            break;

        case 'ul':
            debug('PreLogin: ${client.address()} wants userList.');
            SendUserlist(client, 0);
            break;

        case 'id':
            oIni = new Ini(SettingsPATH);
            let highID = oIni.GetIntValue("UID","HighestID", 0);
            highID++;
            client.sendMessage(highID,1);
            oIni.SetValue("UID","HighestID", highID);
            debug('PreLogin: ${client.address()} was given ID: ${highID}');
            break;

        case 'pcl4_ver':
            oIni = new Ini(SettingsPATH);
            var pcl4v = oIni.GetStrValue("PCLock4","Ver", "");
            p2ini = oIni.GetStrValue("PCLock4",part2, "");
            if (part2 !== pcl4v) {
                if (p2ini.substring(0, 4) === 'http') {
                    client.sendMessage("bu "+p2ini,1);
                } else {
                    client.sendMessage(p2ini,1);
                }
            } else {
                client.end();
            }
            break;

        default:
            client.sendMessage('raw_What do you want from me?', 1);
            break;
    }
}

function SHRegister(client, message) {
    const name = client.name;
    const ip = client.address();

    debug(`SHRegister ${name}, ${message}`);

    const [pass, regcode, email, newsletterRaw] = message.split('*');
    // client sends 0 for yes, 1 for no :P
    const newsletter = !parseInt(newsletterRaw, 10);

    let user = database.users.by('name', name);
    if (user && user.info && user.info.password) {
        client.sendMessage('In Use', 1);
        debug(`${name} (${ip}) tried to reg(InUse).`);
        return;
    }

    if (regcode !== 'SmileyHouse-NoRegCode') {
        client.sendMessage('Wrong Key', 1);
        debug(`${name} (${ip}) tried to reg(WrongKey).`);
        return;
    }

    if (!util.validateUsername(name)) {
        client.sendMessage('Invalid', 1);
        debug(`${name} (${ip}) tried to reg(InvalidName).`);
        return;
    }

    if (!util.validatePassword(pass)) {
        client.sendMessage('raw_Passwords must be only letters and numbers!', 1);
        debug(`${name} (${ip}) tried to reg(InvalidPass = ${pass})`);
        return;
    }

    if (!util.validateEmail(email)) {
        client.sendMessage('raw_Your email is invalid.', 1);
        debug(`${name} (${ip}) tried to reg(InvalidEmail = ${email})`);
        return;
    }

    // TODO: make a user creator instead
    user = {
        name,
        info: {
            email,
            newsletter,
            lastAddress: ip,
            password: bcrypt.hashSync(pass),
            vip: false, // vip can be purchased later
        },
        sh: {
            room: 'SHCourtYard',
            joinRoom: 'SHCourtYard.Pub',
            health: 50,
            maxHealth: 100,
            healthPacks: 0,
            cash: 50,
            alcohol: 0,
            isTrading: false,
        },
        walk: {
            x: 392,
            y: 312,
            motionAngle: -1,
            lastWalk: null,
            changingRooms: false,
        },
        guard: {
            exp: 0,
        },
        magician: {
            mana: 100,
        },
        soldier: {
            bullets: 25,
        },
        inventory: {
            0: '2*1',
        },
        mail: {
            stamps: 0,
        },
        gameToy: {},
        quests: {},
        layers: {
            base: '',
            emotion: '',
            accessory: '',
            left: '',
            right: '',
        },
        misc: {
            maxWeight: 50,
            treeExp: 0,
        },
    };

    database.users.insert(user);
    debug(`${name} (${ip}) registered.`);
    client.sendMessage('raw_Registered! Please login!', 1);
}

function SHLogin(client, message) {
    const name = client.name;
    const ip = client.address();

    const [pass, ver, uid, crc] = message.split('*');

    /* Let's ignore this for now...
    oIni = new Ini(SettingsPATH);
    verAllowed = oIni.GetStrValue("VersionAllowed",ver);
    oIni.CloseFile();
    */

    const user = database.users.by('name', name);
    const id = client.id;

    // Check if version is old before anything else
    /* Ignoring this for now...
    if (verAllowed == "") {
        connection.SendText("BadVersion",1);
        ADDline(name+"["+ip+"] tried to login(OldVer: "+ver+").");
    }
    else if (verAllowed.SubString(0, 4) == "raw_") {
        ADDline(name+"["+ip+"] tried to login(OldVer: "+ver+").");
        connection.SendText(verAllowed,1);
    }
    else if (verAllowed.SubString(0, 4) == "http") {
        ADDline(name+"["+ip+"] tried to login(OldVer: "+ver+").");
        connection.SendText(verAllowed,2);
    }
    else if (verAllowed == "VIP" && !IsVIP(connection)) {
        connection.SendText("raw_This is a VIP Only release!",1);
        ADDline(name+"["+ip+"] tried to login(NotVIP_Ver: "+ver+").");
    }
    */
    if (!user) {
        client.sendMessage('NotUsed', 1);
        debug(`${name} (${ip}) tried to login(NotUsed).`);
        return;
    }

    if (!bcrypt.compareSync(pass, user.info.password)) {
        client.sendMessage('Wrong Password!', 1);
        debug(`${name} (${ip}) tried to login(WrongPass).`);
        return;
    }

    if (user.info.disabled) {
        client.sendMessage(`raw_Your account is disabled(${user.info.disabledReason})!`, 1);
        debug(`${name} (${ip}) tried to login(Disabled).`);
        return;
    }

    /* Ignoring this too
    else if (Server.GetConnectionCount() > 100) {
        ADDline(name+"["+ip+"] tried to login(Server is Full).");
        connection.SendText("Full",1);
    }
    else if (NonVIPUsers > 15 && !oIni.GetIntValue("VIP","Donor")) {
        ADDline(name+"["+ip+"] tried to login(Server is NonVIP Full).");
        connection.SendText("NonVIPFull",1);
    }
    */

    /* TODO: add this back in later
    if (oIni.GetIntValue("Banned",ip)) {
        debug(`${name} (${ip}) tried to login(Banned).`);
        client.sendMessage('raw_You are banned!', 1);
        return;
    }

    if (oIni.GetIntValue("UID",uid)) {
        debug(`${name} (${ip}) tried to login(IDBanned).`);
        client.sendMessage('raw_You are banned!', 1);
        return;
    }
    */

    // TODO: research why this is a possibility and fix it
    // if someone is using this account, kick him
    for (const connection of client.server.connections()) {
        const otherName = connection.name;
        if (otherName === client.name && connection !== client) {
            connection.end();
        }
    }

    user.usedUID = user.usedUID || {};
    user.usedUID.uid = 1;

    user.info.loggedIn = id;
    user.walk.lastTime = '';
    user.walk.motionAngle = -1; // aka Stopped
    user.info.lastIP = ip;
    user.info.lastUID = uid;
    user.info.lastVer = ver;
    user.info.lastDate = new Date().getTime();

    // Kill PowerTimeouts
    user.power = Object.assign({}, user.power, {
        timeout1: 0,
        timeout2: 0,
    });

    // Not Trading
    user.trade = Object.assign({}, user.trade);
    delete user.trade.trading;

    // No Cheats
    delete user.cheats;

    // Give Default layers
    user.ownsBase = {
        0: 1,
        1: 1,
        2: 1,
    };
    user.ownsEmo = {
        0: 1,
        1: 1,
    };
    user.ownsAcc = {
        0: 1,
    };

    let loginCount = user.info.logins || 0;
    loginCount++;
    user.info.logins = loginCount;

    database.users.update(user);

    debug(`${name} (${ip}) logged in.`);

    // TODO: move these out to config somewhere
    const updateMD5 = 'e76aa5975c32cfcb43695d77572fd8a7';
    const updateURL = 'http://puchisoft.com/SmileyHouse/SHCurrent/Data/';
    const toClient = `LOK${updateMD5}\xA4${updateURL}`;
    debug('sending message %s', toClient);
    require('./hexout')(Buffer.from(toClient, 'ascii'));
    client.sendMessage(toClient, 1, 'ascii');
}

// Prelogin
setAction(0, SHPreLogin, false);
setAction(1, SHRegister, false);
setAction(2, SHLogin, false);

// Postlogin
/*
setAction(3, SHChat);
setAction(4, SHHealthPack);
setAction(5, SHBuy);
setAction(6, SHClassChange);
setAction(7, SHUsePower);
setAction(8, WantsToEnterDoor);
setAction(9, MiscCommand);
setAction(10, Trading);
setAction(11, InvMessage);
setAction(12, InvUseItem);
setAction(13, NPCSys);
setAction(14, InvUseItemOnItem);
setAction(15, MotionSet);
setAction(16, SHTakeDamage);
setAction(17, MonsterMsg);
*/


function callAction(subchannel, client, message) {
    const action = actions[subchannel];
    if (action) {
        try {
            action(client, message);
        } catch (e) {
            debug(`exception during action ${subchannel}: ${e}`);
            debug(e.stack);
            client.end();
        }
    } else {
        debug(`subchannel ${subchannel} is not available`);
        client.sendMessage(`Invalid subchannel ${subchannel}`, 1);
    }
}


module.exports = callAction;
