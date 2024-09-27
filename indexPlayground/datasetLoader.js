// https://dnpm.bwhealthcloud.de/api/mtb/fake/data/patient-record
const fs = require('fs');

class DatasetLoader {
    constructor(amountRecords) {
        this.amountRecords = amountRecords
    }
    async downloadDataset(path = "./datasets/") {

        var time = Math.floor(+new Date() / 1000)
        var dic = path + this.amountRecords + "_" + time + "/"
        fs.mkdirSync(dic);
        const url = 'https://dnpm.bwhealthcloud.de/api/mtb/fake/data/patient-record';

        for (var i = 0; i < this.amountRecords; i++) {
            const response = await fetch(url);
            const jsonResponse = await response.json();
            fs.writeFileSync(dic + 'p'+i+'.json', JSON.stringify(jsonResponse));
        }

    }
}


var loader = new DatasetLoader(1000)
loader.downloadDataset()

// var loader = new DatasetLoader(1)
// loader.downloadDataset('./queries/')