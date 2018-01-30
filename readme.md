express-api-tools
=================

A few simple and pragmatic tools to quickly build API endpoints based on Express.

## Basic api modules
This package contains a few modules which can be useful for quickly building JSON api's.
The most notably is the register_endpoint, which leverages caching and rate limiting using
Express as server.

### logging
Simple logging, used by the other modules but can be used on its own too.

```javascript
const log = require('express-api-tools').logging;
```

Logging can be enabled or disabled:
```javascript
log.setEnabled(true);
log.setEnabled(false);
```

Or it can be enabled based on a given startup parameter:
```javascript
log.enableLoggingBasedOnParam('log');
```

Starting the app using the following command will then enable logging:
```
node app.js log
```

Messages can be logged:
```javascript
log.info('some message');
log.error('some error');
```

> Currently there is no difference between info and error logging, this might be included in a future version.

### Cache
Simple caching mechanism to cache API responses. It is used by the register_endpoint module, but can be used on its own.

```javascript
const cache = require('express-api-tools').cache;
```

Quick example:
```javascript
const cachedResponse = cache.getFromCache('get', req.originalUrl); // Where originalUrl is the cache key

if (cachedResponse) {
    res.end(cachedResponse); // Respond to client with cached response
} else {
    // Do some stuff to obtain jsonResult
    res.end(jsonResult); // Respond to client with jsonResult
    cache.putInCache('get', req.originalUrl, 1000, jsonResult); // Cache the jsonResult for 1 second
    cache.cleanupCache(); // Cleanup out dated cache entries
}

```

### Register Endpoint
Pragmatic approach to register endpoints on Express that can be cached and (if required) rate limited.

Without rate limiting:
```javascript
const express = require('express'),
    app = express(),
    registerEndpoint = require('express-api-tools').register_endpoint.default, // Default is without rate limiting
    cacheTime = 60000; // Cache for 1 minute

registerEndpoint(app, '/api/some-endpoint', cacheTime, implementation); // Where implementation is a method that returns the api response
```

When a client requests the /api/some-endpoint resource, the implementation is called. It will not be called again for the next minute.

With rate limiting:
```javascript
const express = require('express'),
    app = express(),
    registerEndpoint = require('express-api-tools').register_endpoint,
    cacheTime = 60000; // Cache for 1 minute
    
registerEndpoint.withRateLimit(app, '/api/some-endpoint/:variable', cacheTime, implementation, 1000);

function implementation({variable}) {
    // Do something with the variable
}

```

The implementation will not be called more often than once a second (1000ms). If the implementation was successfully called,
it will be cached for 1 minute (60000ms).

It is possible to use variables in the api request pretty easily.

## Api endpoints
This package also contains a few example api endpoints that can be used in production.

### env
Simple endpoint that can provide information about the environment on which the server runs. Can be useful
in situations where dev, test, acc and prod environments are separated. The environment name (string) must
be placed in a system variable on the system where the node server is running. This module will provide
the contents of that system variable to the frontend, it will default on a specified value if no system
variable is set.

> When requiring it, it takes two arguments, the system variable to read and the default value to use when
no system variable is set.

Usage:
```javascript
const express = require('express'),
    app = express(),
    env = require('express-api-tools').env('NODE_ENV', 'prod');

env.api(app, '/api/env');
```

### health
A very basic health indicator that just returns 200. Can be used in environments where this api server is
monitored to be available.

Usage:
```javascript
const express = require('express'),
    app = express(),
    health = require('express-api-tools').health;

health.api(app, '/api/health');
```

### Uptime
Api endpoint that will return the uptime of the server since the node process was started OR since it was
last reset. The reset can be useful to remotely reset the uptime. If it is paired with a mechanism on the
frontend that will refresh the page when the uptime is lower than the last retrieved uptime value, it can
be used to make all connected frontends perform a refresh. This might be useful when this service serves
a dashboard or monitoring application.

Usage:
```javascript
const express = require('express'),
    app = express(),
    uptime = require('express-api-tools').uptime;

uptime.api(app, '/api/uptime');
```