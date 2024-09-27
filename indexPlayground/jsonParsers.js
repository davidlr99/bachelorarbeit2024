class JsonParsers {
    buildKey(key) {
        // Key bauen aus String im Format z.B. patient.0.xyz => ["patient",0,"xyz"]
        var keyArray = key.split(".")
        for (var i in keyArray) {
            if (!isNaN(Number(keyArray[i]))) {
                keyArray[i] = parseInt(keyArray[i])
            }
        }
        return keyArray
    }
    traverseWithKey(parsedKey, entry) {
        //Aus key array z.B. ["patient",0,"xyz"] den eigentlichen Wert im Record ermitteln
        var current = entry;
        for (var i in parsedKey) {
            current = current[parsedKey[i]]
        }
        return current
    }
    //{patient:[{xyz:1},{xyz:2},{xyz:3}]}
    //["patient","*","xyz"]
    traverseWithKeyRec(parsedKey, data, matchFilter = []) {

        //Rekrusive implementation die auch wildcard * (bei arrays) kann

        var result = []

        function rec(data, key, level) {

            var ck = key[level]

            if (key.length == level) {

                // if (data != undefined) {
                result.push(data)

                // }
                return data
            }

            level = level += 1


            if (ck != "*") {
                rec(data[ck], key, level)
            } else {
                for (var i = 0; i < data.length; i++) {
                    rec(data[i], key, level)
                }
            }
        }


        rec(data, parsedKey, 0)

        var realResult = [];

        if (matchFilter.length > 0) {
            for (var i in result) {
                if (matchFilter[i] == true) {
                    realResult.push(result[i])
                }
            }
        } else {
            realResult = result
        }

        return realResult

    }
}

module.exports = {
    JsonParsers
};