/*
 * caching functions
 * 
 * */

const ioredis = require("ioredis");
if(CONFIG.cache.enable) {
    const redis = new ioredis(CONFIG.cache);
}

global._CACHE = {};

/*
 * Cache Storage Controls all the Caching Functionality. It helps speed up fetching various cached data directly
 * using indexes. This is important as REDIS Cache forms the core to our speed
 * 
 * */
module.exports = function(server, restify) {

    global._CACHE.initCache = function() {
        console.log("CACHE Initialized");
    },

    global._CACHE.listCacheKeys = function(pattern, callback) {
        if(CONFIG.cache.enable) return callback([]);

        if(pattern==null) pattern = "*";

        keysArr = [];
        redis.keys(pattern).then(function (keys) {
            keys.forEach(function (key) {
              keysArr.push(key);
            });

            callback(keysArr);
          });
    },

    global._CACHE.cacheStatus = function() {
        if(CONFIG.cache.enable) return false;

        return redis.status;
    },

    global._CACHE.clearCache = function(pattern) {
        if(CONFIG.cache.enable) return false;
        if(pattern==null) pattern = "*";
        //'sample_pattern:*'
        return redis.keys(pattern).then(function (keys) {
            // Use pipeline instead of sending one command each time to improve the performance.
            var pipeline = redis.pipeline();
            keys.forEach(function (key) {
              pipeline.del(key);
            });
            return pipeline.exec();
          });
    },

    global._CACHE.deleteData = function(cacheKey) {
        if(CONFIG.cache.enable) return false;
        _CACHE.clearCache(cacheKey);
    },

    global._CACHE.storeData = function(cacheKey, data) {
        if(CONFIG.cache.enable) return false;
        if (redis.status != "ready") return data;

        if (typeof data == "object") data = JSON.stringify(data);
        redis.set(cacheKey, data);
        return data;
    },

    global._CACHE.fetchData = function(cacheKey, callback, defaultData = false) {
        if(CONFIG.cache.enable) return callback([], "error");

        if (redis.status != "ready") {
            callback(defaultData, "error");
            return;
        }
        cacheObj = this;
        result = false;

        redis.get(cacheKey).then(function (result) {
            if (result == null) {
                result = cacheObj.storeData(cacheKey, defaultData);
            }

            if (typeof result == "string") {
                try {
                    resultJSON = JSON.parse(result);
                    if (resultJSON != null) {
                        result = resultJSON;
                    }
                } catch (e) {

                }
            }

            callback(result);
        });
    }
}