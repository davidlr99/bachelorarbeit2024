const { EmbeddingBuilder } = require("../embeddingBuilder");

class ResponseEmbBuilder extends EmbeddingBuilder {
    constructor(data) {
        super(data)
    }
    addResponseFields(fieldName) {
        var fields = {
            responses: "responses.*.value.code"
        }
        for (var i in this.data) {
            var entry = this.data[i].data
            var id = this.data[i].id
            var responses = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.responses), entry)
            for (var n in responses) {
                this.addToField(fieldName, id, JSON.stringify(responses[n]))
            }
        }
    }

    load() {
        this.addResponseFields("responses")
        this.addEmbedding(['responses'])
    }
}

module.exports = {
    ResponseEmbBuilder
};