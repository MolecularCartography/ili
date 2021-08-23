class ObjectCache{
    constructor(activator) {
        this._activator = activator;
        this._capacity = 0;
    }

    get(count){
        if (this._capacity === count)
            return;
        if (count > this._capacity)
            for (let i = this._capacity; i < count; i++)
                this._activator.activate(i);
        else
            for (let i = count; i < this._capacity; i++)
                this._activator.deactivate(i)
        this._capacity = count;
    }
}