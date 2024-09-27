const { SimpleVariantsEmbBuilder } = require("./embeddingsBuilder/simpleVariantsEmbBuilder");
const { CopyVariantsEmbBuilder } = require("./embeddingsBuilder/copyVariantsEmbBuilder");
const { DiagnoseMorphologyEmbBuilder } = require("./embeddingsBuilder/diagnoseMorphologyEmbBuilder");
const { ResponseEmbBuilder } = require("./embeddingsBuilder/responseEmbBuilder");
const { MedicationsEmbBuilder } = require("./embeddingsBuilder/medicationsEmbBuilder");


const { Embedding } = require("./embedding");

class PatientCombinedEmbedding extends Embedding {
    constructor(initalDataset) {
        super()

        this.dataset = initalDataset
        this.embeddingBuilders = []

        this.init()
    }

    //warum init? - Damit die diemensionen des Vektors anhand des bisherigen Datensatzes ermittelt werden.
    init() {
        var simpleVariantsEmbBuilder = new SimpleVariantsEmbBuilder(this.dataset)
        var copyVariantsEmbBuilder = new CopyVariantsEmbBuilder(this.dataset)
        var diagnoseMorphologyEmbBuilder = new DiagnoseMorphologyEmbBuilder(this.dataset)
        var responseEmbBuilder = new ResponseEmbBuilder(this.dataset)
        var medicationsEmbBuilder = new MedicationsEmbBuilder(this.dataset)


        //Reihenfolfe hier wichtig!
        this.embeddingBuilders = [
            {
                object: simpleVariantsEmbBuilder,
                fieldNames: ['simpleVariants']
            },
            {
                object: copyVariantsEmbBuilder,
                fieldNames: ['copyVariants']
            },
            {
                object: diagnoseMorphologyEmbBuilder,
                fieldNames: ['morphologies', 'diagnoses']
            },
            {
                object: responseEmbBuilder,
                fieldNames: ['responses']
            },
            {
                object: medicationsEmbBuilder,
                fieldNames: ["prescribedMedications", "recommendedMedications"]
            }
        ]

        for (var i in this.embeddingBuilders) {
            this.embeddingBuilders[i].object.load()

            //Fields sperren um zu verhindern das Neue hinzugefügt werden.
            this.embeddingBuilders[i].object.lockFields()

        }

    }

    setEmbeddingFromPatient(data) {


        if (data.length > 1) {
            console.log("Es kann nur ein Datenpunkt übergeben werden.")
            return
        }

        this.removeZones()

        for (var i in this.embeddingBuilders) {
            var emb = this.embeddingBuilders[i].object


            //reset emb für neue Daten, nur fields müssen unverändert bleiben

            emb.data = data
            emb.plainResults = {}
            emb.embeddings = {}


            emb.load()


            for (var key in emb.embeddings) {
                this.addZone(key, emb.embeddings[key][Object.keys(emb.embeddings[key])[0]])
            }


        }


    }



}



module.exports = {
    PatientCombinedEmbedding
};