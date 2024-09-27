const { EmbeddingBuilder } = require("../embeddingBuilder");

class CopyVariantsEmbBuilder extends EmbeddingBuilder {
    constructor(data) {
        super(data)
    }
    addCNVFields(fieldName) {
        var fields = {
            copyType: "ngsReports.*.results.copyNumberVariants.*.type.code",
            copyAffectedGenes: "ngsReports.*.results.copyNumberVariants.*.reportedAffectedGenes",
            copyId: "ngsReports.*.results.copyNumberVariants.*.id",
            supportingVariant: "carePlans.*.medicationRecommendations.*.supportingVariants.*.id"
        }




        for (var i in this.data) {
            var entry = this.data[i].data
            var copyTypes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.copyType), entry)
            var affectedGenes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.copyAffectedGenes), entry)

            var supportingEvidenceIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.supportingVariant), entry)
            var copyIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.copyId), entry)


            for (var n in copyTypes) {
                var type = copyTypes[n]
                var copyId = copyIds[n]

                var supporting = false

                if (supportingEvidenceIds.includes(copyId)) {
                    supporting = true
                }



                var affectedGenesAtVariant = affectedGenes[n]
                var affectedGenesCodeArray = []
                for (var m in affectedGenesAtVariant) {
                    var code = affectedGenesAtVariant[m].code
                    affectedGenesCodeArray.push(code)
                }

                //Die Affected genes sortieren => sonst key in JSON falsch 
                affectedGenes.sort()

                var copyVariant = {}
                copyVariant[Object.keys(fields)[0]] = type
                copyVariant[Object.keys(fields)[1]] = affectedGenesCodeArray
                copyVariant[Object.keys(fields)[3]] = supporting


                this.addToField(fieldName, this.data[i].id, JSON.stringify(copyVariant))

            }


        }

    }

    load() {
        this.addCNVFields("copyVariants")
        this.addEmbedding(['copyVariants'])
    }
}

module.exports = {
    CopyVariantsEmbBuilder
};