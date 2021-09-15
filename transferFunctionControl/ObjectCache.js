class ObjectCache{
    constructor(activator) {
        this._activator = activator;
        this._storage = [];
        this._capacity = 0;
    }

    get(count){
        if (this._capacity === count)
            return this._storage;
        if (count > this._capacity) {
            for (let i = this._storage.length; i < count; i++)
                this._storage[i] = this._activator.create();
            for (let i = this._capacity; i < count; i++)
                this._activator.activate(this._storage[i]);
        }
        else
            for (let i = count; i < this._capacity; i++)
                this._activator.deactivate(this._storage[i])
        this._capacity = count;
        return this._storage;
    }
}