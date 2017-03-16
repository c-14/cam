var async = require('async'),
    config = require('./config'),
    crypto = require('crypto'),
    fs = require('fs'),
    joinPath = require('path').join;

var CLIENT_DEPS = ['common.js', 'client.js'];

exports.buildScripts = function (cb) {
    function read(file, cb) {
        fs.readFile(joinPath(__dirname, file), 'UTF-8', cb);
    }
    async.map(CLIENT_DEPS, read, function (err, assets) {
        if (err)
            return cb(err);
        var clientJs = new Buffer(assets.join('\n'), 'UTF-8');
        var hash = crypto.createHash('md5').update(clientJs).digest('base64');
        if (config.URL_PREFIX) {
            var clientJsPath = config.URL_PREFIX + '/' + 'client-' + hash.slice(1, 9).replace(/[\/]/g, 'DERP') + '.js';
        } else {
            var clientJsPath = 'client-' + hash.slice(1, 9).replace(/[\/]/g, 'DERP') + '.js';
        }
        var scriptInfo = {clientJs: clientJs, clientJsPath: '/'+clientJsPath};

        read('index.tmpl.html', function (err, indexTmpl) {
            if (err)
                return cb(err);
            var html = indexTmpl.replace('$CLIENT', clientJsPath);
            html = html.replace('$SOCKJS_URL', JSON.stringify(config.SOCKJS_URL));
            if (config.URL_PREFIX) {
                html = html.replace(/\${URL_PREFIX}/g, config.URL_PREFIX + '/');
            } else {
                html = html.replace('${URL_PREFIX}', '');
            }
            scriptInfo.indexHtml = new Buffer(html, 'UTF-8');
            cb(null, scriptInfo);
        });
    });
};
