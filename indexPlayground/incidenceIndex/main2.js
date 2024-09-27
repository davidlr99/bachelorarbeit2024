const { Patients } = require("../patients");
const { PatientCombinedEmbedding } = require("./patientCombinedEmbedding");


/* Änderung supportingEvidence auf supportingVariants?

  medicationTherapies jetzt therapies?

  guidlineMedicationTheapies jetzt guidelineTherapies?

*/

console.log("Einlesen Patient-Records.")


var patients = new Patients()
var dataset = patients.loadPatients('../datasets/10_1720792465/')
var queries = patients.loadPatients('../queries/1_1720795110/')

console.log("Embedding berechnen.")

var query = [queries[0]]

var queryEmbedding = new PatientCombinedEmbedding(dataset)
queryEmbedding.setEmbeddingFromPatient(query)

var patientCombinedEmbedding = new PatientCombinedEmbedding(dataset)
console.log(patientCombinedEmbedding.embeddingBuilders)

console.log(patientCombinedEmbedding.embeddingBuilders[4].object.fields)
console.log("Vergleichen.")

var ranking = []

for (var i in dataset) {

  patientCombinedEmbedding.setEmbeddingFromPatient([dataset[i]])
  var sim = queryEmbedding.compareTo(patientCombinedEmbedding)

  ranking.push([sim, dataset[i].path, i])

}

ranking.sort(function (a, b) {
  return b[0] - a[0]
});

console.table(ranking)

console.log("Die höchste Ähnlichkeit zu " + queries[0].path + " hat " + ranking[0][1] + ".")


// console.log(queryEmbedding.vectors)

// patientCombinedEmbedding.setEmbeddingFromPatient([dataset[ranking[0][2]]])
// console.log(patientCombinedEmbedding.vectors)


// var patientCombinedEmbedding1 = new PatientCombinedEmbedding(dataSet)
// patientCombinedEmbedding1.setEmbeddingFromPatient([queries[0]])

// console.log("Second one starts")
// var patientCombinedEmbedding2 = new PatientCombinedEmbedding(dataSet)
// patientCombinedEmbedding2.setEmbeddingFromPatient([queries[1]])


// var res = patientCombinedEmbedding1.compareTo(patientCombinedEmbedding2)
// console.table(res)

//https://neo4j.com/