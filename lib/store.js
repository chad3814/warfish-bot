'use strict';

// seconds to live
const DEFAULT_TIMEOUT_MS = 60000;

const keyClear = function (store, key) {
    store.remove(key);
};

class Store {
    constructor() {
        this._map = new Map();
    }

    get(key) {
        if (!this._map.has(key)) {
            return null;
        }
        const data = this._map.get(key);
        clearTimeout(data.timer_id);
        data.timer_id = setTimeout(keyClear, data.timeout_ms, this, key);
        return data.obj;
    }

    has(key) {
        return this._map.has(key);
    }

    set(key, obj, timeout_ms = DEFAULT_TIMEOUT_MS) {
        this.remove(key);
        const data = {
            obj,
            timeout_ms,
            timer_id: setTimeout(keyClear, timeout_ms, this, key),
        };
        this._map.set(key, data);
    }

    remove(key) {
        if (!this._map.has(key)) {
            return;
        }
        const data = this._map.get(key);
        clearTimeout(data.timer_id);
        this._map.delete(key);
    }
}

module.exports = Store;
