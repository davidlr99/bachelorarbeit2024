var fs = require('fs');
const { Record } = require("./record");

class Patients {
    constructor() {
        this.patients = [];
    }
    loadPatients(path = "../dataset/") {
        var patients = []
        var files = fs.readdirSync(path);
        for (var i in files) {
            var file = files[i]
            const data = fs.readFileSync(path+file,{ encoding: 'utf8', flag: 'r' });
            var patient = new Record(i,path+file,data)
            patients.push(patient)
        }
        return patients

        //Besondergeiten hier? Laden der Patienten aus JSON Dateien. 

    }

}

module.exports = {
    Patients
};