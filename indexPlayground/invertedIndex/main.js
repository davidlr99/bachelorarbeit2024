const { Patients } = require("../patients");
const { Index } = require("./index");

const { createIntersectionOfKeys } = require("./helpers");



var patients = new Patients()
var data = patients.loadPatients()

//https://dnpm.bwhealthcloud.de/

// Test: Welche Schnittmenge gibt es bei den Zone Keys in den Patien Records? 
var zones = []
for (var i in data) {
    zones.push(data[i].getZones())
}

var intersection = createIntersectionOfKeys(zones)

//console.log(intersection)



// Diagnoses Index
// Beachte: ein Patient kann mehrere Diagnosen haben: 1:n Beziehung muss im Index bestehen können.
// Lösung: * (wildcard) der alle Array Elemente abfrägt.
//Beispiel p1 (id: 0) hat zwei Diagnosen.

var diagnosesIndex = new Index(data)
diagnosesIndex.buildIndex("diagnoses.*.code.code")
console.log("Diagnoses Index:")
console.log(diagnosesIndex.index)



// SNV Index (ist SNV simpleVariants in JSON?)
// Was wird benötigt? 
//      Gen Index: 
//          "display" anstatt "code" indexieren bei gene? (code!)
//          mehere ngs Reports, mehere simple variants je report (1:n:n)
//      DNA Change
//          Ist DNA Change so zu verstehen: Gen => DNA Change (d.h der DNA Change bezieht sich auf ein Gen) => Gen und DNA Change immer gekoppelt betrachten.
//          Lösung: "Multi Index" das als Schlüssel (gen,dna-change) hat?
//              Vorraussetzung: jedes Gen besitzt genau ein dna-change 1:1 (d.h auf jedes Gen muss ein DNA change kommen)
//      Protein Change
//          Analog zu DNA Change implementiert.

var genSNVIndex = new Index(data)
genSNVIndex.buildIndex("ngsReports.*.results.simpleVariants.*.gene.code")
console.log("SNV Gen Index (simpleVariants):")
console.log(genSNVIndex.index)

//MultiIndex über simpeVariants (gene,dnachange)

var genSNVIndexDNAchange = new Index(data)

genSNVIndexDNAchange.buildMultiIndex(
    ["ngsReports.*.results.simpleVariants.*.gene.code",
        "ngsReports.*.results.simpleVariants.*.dnaChange.code"])

console.log("Multi Index (gen,dnaChange) for simple variants:")
console.log(genSNVIndexDNAchange.index)

//MultiIndex über simplevariants (gene,proteinchange)
//MultiIndex über triple Lösen (evtl Iteration lösen oder über stemming??)
var genSNVIndexProteinChange = new Index(data)

genSNVIndexProteinChange.buildMultiIndex(
    ["ngsReports.*.results.simpleVariants.*.gene.code",
        "ngsReports.*.results.simpleVariants.*.proteinChange.code"])

console.log("Multi Index (gen,proteinChange) for simple variants:")
console.log(genSNVIndexProteinChange.index)

//Frage hierzu: ProteinChange z.B. p.(Gly56Ala^Ser^Cys) soll "ungenau" gesucht werden können (d.h zB nur nach include)
//      Wie schnelle Suche auf Index implementieren? => Ungenaue Suche war nur bei Medication


//Index zum lösen von "Stützend?" (supportingEvidence)
//Frage zu supportingEvidence: Ist es das Feld in studyEnrollmentRecommendations oder in carePlans? 
//      Grundidee: Zwei Index aufauen mit (gen,dnachange)=>(patients) und eins mit (gen,proteinchange)=>(patients) (wobei nur die patientIDs drin sind wenn (gen,dnachange) bzw. (gen,proteinchange) supportingEvidence ist)
//          Match und dann filter liste für key? 


var supportingSNVGenDNAchange = new Index(data)
supportingSNVGenDNAchange.buildMultiIndex(
    ["ngsReports.*.results.simpleVariants.*.gene.code",
        "ngsReports.*.results.simpleVariants.*.dnaChange.code"],

    ["ngsReports.*.results.simpleVariants.*.id",
        "carePlans.*.medicationRecommendations.*.supportingEvidence.*.id"]
)

console.log("Multi Index (gen,dnaChance) if supporting Variant")
console.log(supportingSNVGenDNAchange.index)


//Analog zu proteinChange  


var supportingSNVGenProteinChange = new Index(data)
supportingSNVGenProteinChange.buildMultiIndex(
    ["ngsReports.*.results.simpleVariants.*.gene.code",
        "ngsReports.*.results.simpleVariants.*.proteinChange.code"],

    ["ngsReports.*.results.simpleVariants.*.id",
        "carePlans.*.medicationRecommendations.*.supportingEvidence.*.id"]
)

console.log("Multi Index (gen,proteinChange) if supporting Variant.")
console.log(supportingSNVGenProteinChange.index)


// MutiIndex (gen, dnaChange, proteinChange)
var genSNVDNAChangeProteinChange = new Index(data)

genSNVDNAChangeProteinChange.buildMultiIndex(
    [
        "ngsReports.*.results.simpleVariants.*.gene.code",
        "ngsReports.*.results.simpleVariants.*.proteinChange.code",
        "ngsReports.*.results.simpleVariants.*.dnaChange.code"
    ])

console.log("Multi Index (gen,proteinChange,dnaChange) for simple variants:")
console.log(genSNVDNAChangeProteinChange.index)
