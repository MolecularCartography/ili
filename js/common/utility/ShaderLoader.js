define(['three'], function(three) {
    function ShaderLoader(manager) {
        three.Loader.call(this, manager);
        return this;
    };

    ShaderLoader.prototype = Object.create(three.Loader.prototype, {
        load: {
            value: function(url, onLoad, onProgress, onError) {
                console.log('onLoad', onLoad);
                console.log('onProgress', onProgress);
                console.log('onError', onError);
                const loader = new three.FileLoader(this.manager);
                loader.setPath(this.path);
                loader.setRequestHeader(this.requestHeader);
                loader.setWithCredentials(this.withCredentials);
                loader.load(
                    url,
                    function(data) {
                        try {
                            onLoad(data);
                        } catch (error) {
                            if (onError) {
                                onError(error);
                            } else {
                                console.error(error);
                            }
                        }
                    },
                    onProgress,
                    onError);
            }
        }
    });
    return ShaderLoader;
});


