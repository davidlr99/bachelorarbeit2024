const { EmbeddingBuilder } = require("../embeddingBuilder");

class MedicationsEmbBuilder extends EmbeddingBuilder {
    constructor(data) {
        super(data)
    }
    // addMedicationFields(fieldName) {

    //     var fields = {
    //         medicationPrescribed: "medicationTherapies.*.history.*.medication",
    //         medicationRecommended: "carePlans.*.medicationRecommendations.*.medication"
    //     }

    //     for (var i in this.data) {
    //         var entry = this.data[i].data
    //         var id = this.data[i].id
    //         var medicationPrescribedInTherapies = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.medicationPrescribed), entry)
    //         var medicationsRecommendations = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.medicationRecommended), entry)

    //         var therapiesWithMedications = []

    //         for (var n in medicationPrescribedInTherapies) {
    //             var medicationsInTherapy = medicationPrescribedInTherapies[n]
    //             var medicationNamesInOneTherapy = []
    //             for (var m in medicationsInTherapy) {
    //                 medicationNamesInOneTherapy.push(medicationsInTherapy[m].code)
    //             }

    //             medicationNamesInOneTherapy.sort()
    //             therapiesWithMedications.push(medicationNamesInOneTherapy)
    //         }

    //         therapiesWithMedications.sort()

    //         var recommendationsWithMedications = []

    //         for (var n in medicationsRecommendations) {
    //             var recommendation = medicationsRecommendations[n]
    //             var medications = []
    //             for (var m in recommendation) {
    //                 medications.push(recommendation[m].code)
    //             }
    //             medications.sort()
    //             recommendationsWithMedications.push(medications)

    //         }

    //         recommendationsWithMedications.sort()



    //         var field = { medicationInTherapies: therapiesWithMedications, medicationInRecommendations: recommendationsWithMedications }
    //         this.addToField(fieldName, id, JSON.stringify(field))

    //     }

    // }

    addPrecribedMedicine(fieldName) {
        //Vielleicht doch besser beide (presceibed udn recommended) in einem feld zu lassen und nur Diemension reduzieren?
        //Verwendete/Verschirebene Medzin setzt sich zusammen aus letzten ELement (nach Datum sortiert) von medicationTherapies und guidelineMedicationTherapies
        var fields = {
            medicationPrescribedMTB: "therapies.*",
            medicationPrescribedGuidline: "guidelineTherapies.*",
        }

        for (var i in this.data) {
            var entry = this.data[i].data
            var id = this.data[i].id
            var medicationPrescribedMTB = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.medicationPrescribedMTB), entry)
            var medicationPrescribedGuideline = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.medicationPrescribedGuidline), entry)

            var medication = []


            //Medication verschrieben von MTB => Aus aktuellestem History objekt.            
            for (var n in medicationPrescribedMTB) {
                var history = medicationPrescribedMTB[n].history
                history.sort(function (a, b) {
                    var t1 = (new Date(a.recordedOn)).getTime();
                    var t2 = (new Date(b.recordedOn)).getTime();
                    return t2 - t1;
                });

                if (history.length != undefined && history.length > 0) {
                    var latestMedication = history[0].medication
                    var medicationNamesInOneTherapy = []
                    for (var m in latestMedication) {
                        medicationNamesInOneTherapy.push(latestMedication[m].display)
                    }
                    medicationNamesInOneTherapy.sort()

                    medication.push(medicationNamesInOneTherapy)
                }

            }


            for (var n in medicationPrescribedGuideline) {
                var guidlineMedication = medicationPrescribedGuideline[n].medication
                var medicationNamesInOneTherapy = []
                for (var m in guidlineMedication) {
                    medicationNamesInOneTherapy.push(guidlineMedication[m].display)
                }
                medicationNamesInOneTherapy.sort()
                medication.push(medicationNamesInOneTherapy)
            }





            for (var i in medication) {
                this.addToField(fieldName, id, JSON.stringify(medication[i]))
            }





        }


    }

    addRecommendedMedicine(fieldName) {

        var fields = {
            medicationRecommended: "carePlans.*.medicationRecommendations.*.medication"
        }


        for (var i in this.data) {
            var entry = this.data[i].data
            var id = this.data[i].id

            var medicationsRecommendations = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.medicationRecommended), entry)

            for (var n in medicationsRecommendations) {
                var recommendation = medicationsRecommendations[n]
                var medications = []
                for (var m in recommendation) {
                    medications.push(recommendation[m].display)
                }
                medications.sort()

                this.addToField(fieldName, id, JSON.stringify(medications))


            }

        }




    }

    load() {
        this.addPrecribedMedicine("prescribedMedications")
        this.addRecommendedMedicine("recommendedMedications")
        this.addEmbedding(["prescribedMedications", "recommendedMedications"])
    }
}

module.exports = {
    MedicationsEmbBuilder
};