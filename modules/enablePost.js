const bodyParser = require('body-parser');

/**
 * Enables the use of POST handling (activating body-parser).
 *
 * Usage:
 * const express = require('express');
 * const app = express();
 * require('express-api-tools').enablePost.enablePost(app);
 *
 * Later on:
 * registerPost(express, baseUrl, cacheTime, function(params, timeout, body) {});
 *
 * Where 'body' now contains the posted body.
 */
module.exports = (function() {
    function enablePost(express) {
        express.use(bodyParser.json()); // support json encoded bodies
        express.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    }

    return {
        'enablePost': enablePost
    };
}());
