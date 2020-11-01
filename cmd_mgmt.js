'use strict';

// Command Manager
// funey, 2020

const fs = require('fs');
const Log = require('./log');
const Logging = new Log('cmd_mgmt');

module.exports.Initialise = function(Client) {
  // Now that we initialised that, start the parsing.
  Logging.log('Initialising commands...')
  Client.Commands = new Set();
  const CommandsDir = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));
    
  for (const Files of CommandsDir) {
      let temp = require('./cmds/' + Files);
      Logging.log(`Found command module: ${Files}`);
      Client.Commands.add(temp)
  }

  Logging.log('Done loading commands.')
}