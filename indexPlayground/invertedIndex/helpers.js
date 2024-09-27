function createIntersectionOfKeys(keys) {
    var current = new Set(keys[0])
    for(var i in keys){
        var c = new Set(keys[i])
        current = current.intersection(c)
    }

    return Array.from(current)
}



module.exports = {
    createIntersectionOfKeys
};