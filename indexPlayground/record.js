class Record {
    constructor(id, path, rawData) {
        this.id = id
        this.path = path
        this.data = JSON.parse(rawData)

    }

    getZones() {
        //Was macht getZones? Lädt alle keys die ein epatienten Record hat. Evtl später inressant um zu schauen 
        // bei welchen Parametern eine Suche sinn machen würde, man könnte z.B. Schauen ob es 
        // keys gibt mit denen man mit "hoher Ausschlagskraft" einen Patienten bzw. Gruppen von 
        // Patienten indentifizieren kann.
        var allKeys = []
        var nextToVisit = []
        var c = 0
        function recGetKey(path = undefined, data) {
            var keys = Object.keys(data)

            if ((typeof data) != 'object') {
                keys = []
            }

            if (keys.length == 0) { /// nur root level paths speichern
                if (!allKeys.includes(path)) {
                    allKeys.push(path)
                }
            }

            if (path != undefined) {
                path = path + "."
            } else {
                path = ''
            }


            for (var i in keys) {
                if (!nextToVisit.includes([path + keys[i], data[keys[i]]])) {
                    nextToVisit.push([path + keys[i], data[keys[i]]])
                }
            }

            var next = nextToVisit.shift()

            if (next != undefined) {
                recGetKey(...next)

            }

        }

        recGetKey(undefined, this.data)


        
        return allKeys

    }
}


module.exports = {
    Record
};