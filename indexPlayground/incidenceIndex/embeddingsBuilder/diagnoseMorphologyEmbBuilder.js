const { EmbeddingBuilder } = require("../embeddingBuilder");

class DiagnoseMorphologyEmbBuilder extends EmbeddingBuilder {
    constructor(data) {
        super(data)
    }
    // addDiagnoseMorphologyFields(fieldName) {
    //     var fields = {
    //         diagnosesId: "diagnoses.*.id",
    //         diagnosesCode: "diagnoses.*.code.code",
    //         specimens: "specimens.*",
    //         histologyReports: "histologyReports.*"
    //     }

    //     for (var i in this.data) {
    //         var entry = this.data[i].data
    //         var id = this.data[i].id

    //         var diagnoseIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.diagnosesId), entry)
    //         var diagnoseCodes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.diagnosesCode), entry)
    //         var specimens = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.specimens), entry)
    //         var histologyReports = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.histologyReports), entry)

    //         for (var n in diagnoseIds) {
    //             var diagnoseId = diagnoseIds[n]
    //             var diagnoseCode = diagnoseCodes[n]
    //             // console.log("Patient: "+i+" "+ diagnoseId+" - "+diagnoseCode)
    //             //check ob Proben für Diagnose existieren

    //             var morphologies = []

    //             for (var m in specimens) {
    //                 var specimen = specimens[m]
    //                 if (specimen.diagnosis.id == diagnoseId) {
    //                     var specimenId = specimen.id
    //                     for (var o in histologyReports) {
    //                         var histologyReport = histologyReports[o]
    //                         if (specimenId == histologyReport.specimen.id) {
    //                             morphologies.push(histologyReport.results.tumorMorphology.value.code)
    //                         }

    //                     }
    //                 }
    //             }

    //             //Morpholgien Sortieren - sonst evtl duplikate bei feldern
    //             morphologies.sort()


    //             var field = { diagose: diagnoseCode, morphologies: morphologies }
    //             this.addToField(fieldName, id, JSON.stringify(field))



    //         }

    //     }
    // }

    addDiagnoseFields(fieldName) {
        var fields = {
            diagnosesCode: "diagnoses.*.code.code",
        }

        for (var i in this.data) {
            var entry = this.data[i].data
            var id = this.data[i].id
            var diagnoseCodes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.diagnosesCode), entry)
            for (var n in diagnoseCodes) {
                this.addToField(fieldName, id, diagnoseCodes[n])
            }

        }
    }

    addMorphologyFields(fieldName) {
        var fields = {
            morphologyCode: "histologyReports.*.results.tumorMorphology.value.code"
        }

        for (var i in this.data) {
            var entry = this.data[i].data
            var id = this.data[i].id
            var morphologyCodes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.morphologyCode), entry)
            for (var n in morphologyCodes) {
                this.addToField(fieldName, id, morphologyCodes[n])
            }

        }

    }

    load() {
        this.addDiagnoseFields('diagnoses')
        this.addMorphologyFields('morphologies')
        this.addEmbedding(['morphologies', 'diagnoses'])
    }
}

module.exports = {
    DiagnoseMorphologyEmbBuilder
};