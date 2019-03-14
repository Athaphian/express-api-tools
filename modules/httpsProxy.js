const Https = require('https'),
    HttpsProxyAgent = require('https-proxy-agent');

module.exports = (function() {

    var agent;

    function withProxy(host, port) {

        agent = new HttpsProxyAgent({
            host: host,
            port: port
        });

        function getJson(inputUrl, headers) {

            const url = inputUrl.substr(8),
                indexOfSlash = url.indexOf('/'),
                host = url.substr(0, indexOfSlash),
                path = url.substr(indexOfSlash);

            return new Promise(function(resolve) {
                let responseData = '';
                Https.request({
                    // like you'd do it usually...
                    host: host,
                    port: 443,
                    method: 'GET',
                    path: path,
                    agent: agent,
                    headers: headers
                }, function (res) {
                    res.on('data', function (data) {
                        responseData += data;
                    });

                    res.on('end', function () {
                        try {
                            resolve(JSON.parse(responseData.toString()));
                        } catch (e) {
                            resolve({
                                error: e,
                                data: data.toString()
                            });
                        }
                    });
                }).end();
            });
        }

        function postJson(inputUrl, body, headers) {

            const url = inputUrl.substr(8),
                indexOfSlash = url.indexOf('/'),
                host = url.substr(0, indexOfSlash),
                path = url.substr(indexOfSlash);

            return new Promise(function(resolve) {
                let responseData = '';
                const post_req = Https.request({
                    // like you'd do it usually...
                    host: host,
                    port: 443,
                    method: 'POST',
                    path: path,
                    agent: agent,
                    //json: true,
                    headers: headers
                    // body: body
                }, function (res) {
                    res.on('data', function (data) {
                        responseData += data;
                    });

                    res.on('end', function () {
                        try {
                            resolve(JSON.parse(responseData.toString()));
                        } catch (e) {
                            resolve({
                                error: e,
                                data: data.toString()
                            });
                        }
                    });
                });

                post_req.write(body);
                post_req.end();
            });
        }

        return {
            getJson: getJson,
            postJson: postJson
        }
    }

    return {
        'withProxy': withProxy
    };
}());
