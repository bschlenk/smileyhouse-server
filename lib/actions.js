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

    switch(part1) {
        case 'mailpass':
            // TODO: no SHMailPass.exe... figure this out
            debug('PreLogin: ${client.address()} requested password (email)');
            client.sendMessage('mailsent',1);
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

    user = {
        info: {
            name,
            email,
            newsletter,
            lastAddress: ip,
            password: bcrypt.hashSync(pass),
        },
        sh: {
            room: 'SHCourtYard',
            joinRoom: 'SHCourtYard.Pub',
            health: 50,
            maxHealth: 100,
            cash: 50,
        },
        walk: {
            xPos: 392,
            yPos: 312,
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
        misc: {
            maxWeight: 50,
        },
    };

    database.users.insert(user);
    debug(`${name} (${ip}) registered.`);
    client.sendMessage('raw_Registered! Please login!', 1);
}

function SHLogin(client, message) {
    const name = client.name;
    const ip = connection.address();

    const [pass, ver, uid, crc] = message.split('*');

    /* Let's ignore this for now...
    oIni = new Ini(SettingsPATH);
    verAllowed = oIni.GetStrValue("VersionAllowed",ver);
    oIni.CloseFile();
    */

    const user = database.users.by('name', name);
    const id = client.id;

    //Check if version is old before anything else
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

    // if someone is using this account, kick him
    for (const connection of client.server._connections.values()) {
        const otherName = connection.name;
        if (otherName === client.name && connection !== client) {
            connection.end();
        }
    }

    usdVerInt = oIni.GetIntValue("UsedVersion",ver,0);
    usdVerInt++;
    oIni.SetValue("UsedVersion",ver,usdVerInt);

    oIni.SetValue("UsedUID",uid,1);

    oIni.SetValue("Info","LoggedIn",id);
    oIni.SetValue("Walk","LastTime","");
    oIni.SetValue("Walk","MotionAngle",-1); //aka Stopped
    oIni.SetValue("Info","LastIP",ip);
    oIni.SetValue("Info","LastUID",uid);
    oIni.SetValue("Info","LastVer",ver);
    Date = System.GetCurrentMonth+"-"+System.GetCurrentDay+"-"+System.GetCurrentYear;
    oIni.SetValue("Info","LastDate",Date);

    //Kill PowerTimeouts
    oIni.SetValue("Power","Timeout1",0);
    oIni.SetValue("Power","Timeout2",0);

    //Not Trading
    oIni.DeleteItem("Trade","IsTrading");
    //No Cheats
    oIni.DeleteItem("Cheats","CanAlwaysFight");
    oIni.DeleteItem("Cheats","GodMode");

    //Give Default layers
    oIni.SetValue("OwnsBase", 0,1);
    oIni.SetValue("OwnsBase", 1,1);
    oIni.SetValue("OwnsBase", 2,1);
    oIni.SetValue("OwnsEmo", 0,1);
    oIni.SetValue("OwnsEmo", 1,1);
    oIni.SetValue("OwnsAcc", 0,1);


    uLoginCount = oIni.GetIntValue("Info","#OfLogins",0);
    uLoginCount++;
    oIni.SetValue("Info","#OfLogins",uLoginCount);

    ADDline(name+"["+ip+"] logged in.");

    connection.SendText("LOK"+updateMD5+"¤"+updateURL,1);
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
        action(client, message);
    } else {
        debug(`subchannel ${subchannel} is not available`);
        client.sendMessage(`Invalid subchannel ${subchannel}`, 1);
    }
}


module.exports = callAction;
