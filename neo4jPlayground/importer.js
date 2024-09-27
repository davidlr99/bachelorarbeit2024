const { Patients } = require("../indexPlayground/patients");
const { Neo4j } = require("./neo4j");


class Importer {
    constructor(jsonRecordsLocation) {
        this.neo4j = new Neo4j('neo4j://localhost', 'neo4j', 'neo4j', 'ZejqscP67W8f5rZ8FikFq4Bpmbz8LLD96')

        var patients = new Patients()
        this.dataset = patients.loadPatients(jsonRecordsLocation)
        console.log(this.dataset)
    }
    async addNode(label, id) {
        await this.neo4j.query("CREATE CONSTRAINT IF NOT EXISTS FOR (n: " + label + ") REQUIRE n.id IS UNIQUE;")
        await this.neo4j.query("MERGE (n:" + label + " {id: $id}) RETURN n", { id: id })
        console.log("adding node")
    }
    async setProperties(label, id, data) {
        console.log(data)
        for (var key in data) {
            var e = data[key]
            await this.neo4j.query('MATCH (n:' + label + ' {id: $id}) SET n.' + key + ' = $data', { id: id, data: e })

        }
    }

    async createRelationship(fromLabel, fromId, toLabel, toId, relationshipName) {
        await this.neo4j.query('MATCH (n:' + fromLabel + ' {id: $id1}),(m:' + toLabel + ' {id: $id2}) MERGE (n)-[r:' + relationshipName + ']->(m) RETURN r', { id1: fromId, id2: toId })
    }
    async add() {




        for (var i in this.dataset) {

            var record = this.dataset[i]
            var data = record.data

            //Add Patient
            await this.addNode("Patient", data.patient.id)
            await this.setProperties("Patient", data.patient.id, { birthDate: data.patient.birthDate, genderCode: data.patient.gender.code, vitalStatus: data.patient.vitalStatus.code })

            //Add episodesOfCare
            for (var n in data.episodesOfCare) {
                await this.addNode("EpisodesOfCare", data.episodesOfCare[n].id)
                await this.setProperties("EpisodesOfCare", data.episodesOfCare[n].id, { transferTan: data.episodesOfCare[n].transferTan, periodStart: data.episodesOfCare[n].period.start })

                for (var m in data.episodesOfCare[n].diagnoses) {
                    await this.addNode("Diagnose", data.episodesOfCare[n].diagnoses[m].id)
                    await this.createRelationship("EpisodesOfCare", data.episodesOfCare[n].id, "Diagnose", data.episodesOfCare[n].diagnoses[m].id, "BELONGS_TO")
                    await this.createRelationship("Patient", data.patient.id, "Diagnose", data.episodesOfCare[n].diagnoses[m].id, "DIAGNOSED_WITH")

                }

            }


            //Add Diagnoses
            for (var n in data.diagnoses) {
                await this.addNode("Diagnose", data.diagnoses[n].id)
                await this.createRelationship("Patient", data.patient.id, "Diagnose", data.diagnoses[n].id, "DIAGNOSED_WITH")
                await this.setProperties("Diagnose", data.diagnoses[n].id, { recordedOn: data.diagnoses[n].recordedOn })
                await this.addNode("ICD_10", data.diagnoses[n].code.code)
                await this.setProperties("ICD_10", data.diagnoses[n].code.code, { display: data.diagnoses[n].code.display })
                await this.addNode("TumorGrade", data.diagnoses[n].tumorGrade.code)
                await this.setProperties("TumorGrade", data.diagnoses[n].tumorGrade.code, {
                    display: data.diagnoses[n].tumorGrade.display,
                })
                await this.addNode("WHOGrading", data.diagnoses[n].whoGrading.code)
                await this.setProperties("WHOGrading", data.diagnoses[n].whoGrading.code, {
                    whoGradingDisplay: data.diagnoses[n].whoGrading.display
                })

                await this.createRelationship("Diagnose", data.diagnoses[n].id, "ICD_10", data.diagnoses[n].code.code, "HAS_ICD_10")
                await this.createRelationship("Diagnose", data.diagnoses[n].id, "TumorGrade", data.diagnoses[n].tumorGrade.code, "HAS_TUMOR_GRADE")
                await this.createRelationship("Diagnose", data.diagnoses[n].id, "WHOGrading", data.diagnoses[n].whoGrading.code, "HAS_WHO_TUMOR_GRADE")


            }

            //Add guidelineTherapies
            for (var n in data.guidelineTherapies) {
                await this.addNode("GuidelineTherapy", data.guidelineTherapies[n].id)
                await this.createRelationship("Patient", data.patient.id, "GuidelineTherapy", data.guidelineTherapies[n].id, "PARTICPATED_IN_GUIDLINE_THERAPY")
                await this.createRelationship("GuidelineTherapy", data.guidelineTherapies[n].id, "Diagnose", data.guidelineTherapies[n].indication.id, "HAS_INDICATION")


                await this.setProperties("GuidelineProcedure", data.guidelineTherapies[n].id,
                    {
                        therapyLine: data.guidelineTherapies[n].therapyLine,
                        recordedOn: data.guidelineTherapies[n].recordedOn,
                        status: data.guidelineTherapies[n].status.code,
                        statusReason: data.guidelineTherapies[n].status.code,
                        notes: data.guidelineTherapies[n].notes,

                    })

                for (var m in data.guidelineTherapies[n].medication) {
                    await this.addNode("Medication", data.guidelineTherapies[n].medication[m].code)
                    await this.setProperties("Medication", data.guidelineTherapies[n].medication[m].code, { display: data.guidelineTherapies[n].medication[m].display })
                    await this.createRelationship("GuidelineTherapy", data.guidelineTherapies[n].id, "Medication", data.guidelineTherapies[n].medication[m].code, "HAS_MEDICATION")

                }


            }

            // Add guidlineProcedures 

            for (var n in data.guidelineProcedures) {
                await this.addNode("GuidelineProcedure", data.guidelineProcedures[n].id)
                await this.createRelationship("Patient", data.patient.id, "GuidelineTherapy", data.guidelineTherapies[n].id, "PARTICPATED_IN_GUIDLINE_THERAPY")
                await this.createRelationship("GuidelineTherapy", data.guidelineTherapies[n].id, "Diagnose", data.guidelineTherapies[n].indication.id, "HAS_INDICATION")


                await this.setProperties("GuidelineProcedure", data.guidelineTherapies[n].id,
                    {
                        therapyLine: data.guidelineTherapies[n].therapyLine,
                        recordedOn: data.guidelineTherapies[n].recordedOn,
                        status: data.guidelineTherapies[n].status.code,
                        statusReason: data.guidelineTherapies[n].status.code,
                        notes: data.guidelineTherapies[n].notes,

                    })

                for (var m in data.guidelineTherapies[n].medication) {
                    await this.addNode("Medication", data.guidelineTherapies[n].medication[m].code)
                    await this.setProperties("Medication", data.guidelineTherapies[n].medication[m].code, { display: data.guidelineTherapies[n].medication[m].display })
                    await this.createRelationship("GuidelineTherapy", data.guidelineTherapies[n].id, "Medication", data.guidelineTherapies[n].medication[m].code, "HAS_MEDICATION")

                }


            }



        }

        console.log("Import done")

        this.neo4j.close()
    }




}

var i = new Importer('../indexPlayground/datasets/10_1720792465/')
i.add()
