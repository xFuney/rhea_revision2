'use strict';

// Message processor
// Funey 2020
const { promisify } = require('util')
const sleep = promisify(setTimeout)

// Stuff for JSON serialisation/de-serialisation.
function replacer(key, value) {
    if (value instanceof RegExp)
      return ("__REGEXP " + value.toString());
    else
        return value;
}
      
function reviver(key, value) {
    if (value.toString().indexOf("__REGEXP ") == 0) {
        var m = value.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
        return new RegExp(m[1], m[2] || "");
    } else
        return value;
}

const Processing = [
    function(Client, Discord, message) {
        return {"ok": true, "reason": "[AUTOMOD] Testing."};
    },

     /*function(Client, Discord, message) {
        let b = Date.now()
        while (Date.now() - b < 1500) {
            // Do nothing...
        }
        return {"ok": true, "reason": "[AUTOMOD] Testing."};
    }*/

    function(Client,Discord,message) {
        let tmp = new Client.Libraries.Database(message.guild.id);

        let wb = tmp.NPgetObject('word-blacklist');
        if (!wb[0]) return {"ok": true}

        tmp.silentKill();

        let actual_wb = wb[0].value.split(',');

        let ok = true;
        actual_wb.forEach( (blacklisted) => {
            if (message.content.includes(blacklisted)) {
                ok = false;
            }
        })

        return {"ok": ok, "reason": "[AUTOMOD] Word blacklist."}
    },

    // Regexp blacklisting.
    function(Client,Discord,message) {
        let tmp = new Client.Libraries.Database(message.guild.id);

        let rb = tmp.NPgetObject('regex-blacklist');
        if (!rb[0]) return {"ok": true};

        tmp.silentKill();

        let actual_rb = JSON.parse(rb[0].value, reviver); 

        let ok = true;
        for (const i in actual_rb["blacklist"]) {
            // Iterate through blacklist
            let regex = actual_rb["blacklist"][i]

            // Now that we have our regex we can check it against our string.
            let searching = message.content.toLowerCase();
            searching = searching.search(regex);
            
            //console.log(searching)
            if (searching > -1) {
                // Regex blacklist tripped.
                //console.log('REGEX BLACKLIST TRIPPED')

                ok = false;
                
            }
        }

        return {"ok": ok, "reason": "[AUTOMOD] Regex Blacklist"}

    }
];

module.exports = function(Client, Discord, Message) {
    let messageOK = {"ok": true};
    for (const i in Processing) {
        let Processor = Processing[i](Client, Discord, Message);
        if (Processor.ok == false) {
            // Message is not OK.
            messageOK = Processor;
            return Processor;
        }
    }

    return messageOK;
}