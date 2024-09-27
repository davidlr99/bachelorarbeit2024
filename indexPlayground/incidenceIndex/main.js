const { Patients } = require("../patients");

const { SimpleVariantsEmbBuilder } = require("./embeddingsBuilder/simpleVariantsEmbBuilder");
const { CopyVariantsEmbBuilder } = require("./embeddingsBuilder/copyVariantsEmbBuilder");
const { DiagnoseMorphologyEmbBuilder } = require("./embeddingsBuilder/diagnoseMorphologyEmbBuilder");
const { ResponseEmbBuilder } = require("./embeddingsBuilder/responseEmbBuilder");
const { MedicationsEmbBuilder } = require("./embeddingsBuilder/medicationsEmbBuilder");




//Grundidee: Repräsentation der Patient-Records als Vectorembeddings
//Embedding aus meheren Embedding "parts" zusammenbauen => orientierung an dnpm.bwhealthcloud.de Suchmaske
// Neue Reihenfolge: zuerst Embedding => Vektor => Angepasste Suche (Beispiel Proteinchange, DNA change kein perfect match)

// https://dnpm.bwhealthcloud.de/mtb/

var patients = new Patients()
var data = patients.loadPatients()


var simpleVariantsEmb = new SimpleVariantsEmbBuilder(data)

// Frage zu SNV Suche: Suche nach DNA-Änderung und Proteinänderung ist UND oder ODER verknüfpung? => Kann beides angegeben werden und ist dann UND Verknüpfung.
// was kann "weggelassen werden"? Kann nur nach dnaChange oder ProteinChange ohne Gen gesucht werden? => Gen optional 
// kann dnaChange und proteinChange ohne Gen angegeben werden? Macht es überhaupt Sinn? => Kann "ungenau" sein => Substring möglih Gly12* => Gly12Cys
// inwiefern kann "ungenau" gesucht werden d.h. z.B. bei proteinChange? Muss immer genau angegeben werden? Wie bei dnaChange? => Genau das Gleiche bei DnaChange (substring)
// TODO: supportingVariant => unschön im index 

simpleVariantsEmb.addSNVFields('simpleVariants')
simpleVariantsEmb.addEmbedding(['simpleVariants'])

// console.log(simpleVariantsEmb)

// console.log(simpleVariantsEmb.embeddings)
// console.log(simpleVariantsEmb.fields)
// console.log(simpleVariantsEmb.plainResults.simpleVariants)


// Frage zu CNVs (copyNumberVariants): Suche nach "Betroffene Gene" bedeutet das Gene welche in Suche angegeben sind als Teilmenge in reportedAffectedGenes vorkommen müssen? => Ja
// Schwierigkeiten: AffectedGenes sortieren => sonst feld evtl nicht eindeutig (andere Sortierung im array wäre anderes feld)
var copyVariantsEmb = new CopyVariantsEmbBuilder(data)
copyVariantsEmb.addCNVFields("copyVariants")
copyVariantsEmb.addEmbedding(['copyVariants'])



// console.log(copyVariantsEmb.fields)
// console.log(copyVariantsEmb.embeddings)


// DNA und RNA Fusions
// Gibt es zu DNA und RNA Fusions auch Beispieldaten?


// Diagnose und Tumormorphologie
// Gehört zu jeder Diagnose eine Tumor(morphologie)? Ist jede Tumormorphologie immer einer Diagnose zuordbar? => Kein UND Verknüpfung zwischen Diaganose und Morphologie 
//TODO: Wieder trennen, DONE
//Diagnosen sollen zuordbar sein auf patient und morphologie soll zuordbar sein auf patient
var diagnoseMorphologyEmb = new DiagnoseMorphologyEmbBuilder(data)
// diagnoseMorphologyEmb.addDiagnoseMorphologyFields("diagnoseMorphology")
// diagnoseMorphologyEmb.addEmbedding(['diagnoseMorphology'])
diagnoseMorphologyEmb.addDiagnoseFields('diagnoses')
// console.log(diagnoseMorphologyEmb.fields)
// console.log(diagnoseMorphologyEmb.embeddings)
diagnoseMorphologyEmb.addMorphologyFields('morphologies')

diagnoseMorphologyEmb.addEmbedding(['morphologies','diagnoses'])
// console.log(diagnoseMorphologyEmb.fields)
// console.log(diagnoseMorphologyEmb.embeddings)


// Response 
// Wie hängt Reponse mit Therapy und Diagnoses zusammen? Alles in Embedding "verknüpfen"? (reponse,therapie,diagnose)
// oder gehört es zur "Diagnose und Tumormorphologie"?
// Bezieht sich Response auch noch auf Medication?
// Kann es "Medication" ohne "reponse" geben
// -- oder einfach nur über Reponses suchen, egal welche Diagnose und Therapie der Reponse zu Grunde liegt?
// -- (evtl. dann bei scoring berücksichtigen)
var responseEmb = new ResponseEmbBuilder(data)
responseEmb.addResponseFields("responses")
responseEmb.addEmbedding(['responses'])
//Aktuelle: Einfach nur über "reponseCode" ohne Beziehung zu Therapies bzw. Diagnoses => Aktuell ist richtig
// console.log(responseEmb.fields)
// console.log(responseEmb.embeddings)


//Medication
// TODO: Nicht auf Code beziehen => weil ein Wirkstoff zwei verschiedene ELtern haben kann => Auf Namen beziehen.
// Bezieht sich Medication auch auf Alteration/Diagnose/Response oder alleinstehend? Warum?

// ==> Nur das aktuellste Object aus History nach Attribut recordedOn ist relevant  => d.h. die anderen verwerfen.
// Medication History wird aufgezeichnet um genauen verlauf rekonstruieren zu können wie patient vom MTB behandelt wurde (kann therapien anfangen, abbrechen, etc)
// Alle Indexes trennen möglich


// In usedDrugs Patienten die Wirkstoff nach MTB und davor bekommen haben.

// Verabreicht? In medicationTherapies => history => medication
// Empfohlen? In carePlans => medicationRecommendations => medication
//      Sind in dem "medications" Array dann auch die "Kombinationen"?
//      Was wenn "Empfohlen?" und "Verabreicht?" aktiviert? UND Verknüpung oder ODER Verknüfung?
// Wie war die Suche nochmal? "Ungenau" möglich?


// => Auch usedDrugs dh die Medications vor MTB auch indizieren (guidlineTherapies)
// zweite dimension weg => ein field für jede thereapie
var medicationsEmb = new MedicationsEmbBuilder(data)
// medicationsEmb.addMedicationFields("medications")
// medicationsEmb.addEmbedding(["medications"])

medicationsEmb.addPrecribedMedicine("prescribedMedications")
medicationsEmb.addRecommendedMedicine("recommendedMedications")

medicationsEmb.addEmbedding(["prescribedMedications","recommendedMedications"])

// console.log(medicationsEmb.fields)
console.log(medicationsEmb.embeddings)

