'use strict';

// Logging System
// Funey, 2020

module.exports = function(name) {

    this.log = function(sText, severity) {
        if (severity == 1) {
            // Log.
            console.log(`[${name}] [LOG] ${sText}`)
        } else if (severity == 2) {
            console.log(`[${name}] [WARN] ${sText}`)
        } else if (severity == 3) {
            console.log(`[${name}] [ERROR] ${sText}`)
        } else {
            console.log(`[${name}] [LOG] ${sText}`)
        }
    }

    this.log('Logging initialised for this module.', 1)
}