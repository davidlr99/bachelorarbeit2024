class Embedding {
    constructor() {
        this.vectors = {}
    }
    addZone(name, values) {
        this.vectors[name] = values
    }

    removeZones(){
        this.vectors = {}
    }

    compareTo(otherEmbedding, zones = [], weighting = {}) {

        if (zones.length == 0) {
            zones = Object.keys(this.vectors)
            zones.forEach((key) => weighting[key] = 1);

        }



        var results = {}

        for (var i in zones) {
            var key = zones[i]
            var vec1 = this.vectors[key]
            var vec2 = otherEmbedding.vectors[key]


            // results[key] = this.cosineSimilarity(vec1, vec2)
            results[key] = this.jaccardSimilarity(vec1, vec2)

        }


        //Gewichten

        var total = 0.0
        for (var i in weighting) {
            total += weighting[i]
        }

        var result = 0.0

        for (var i in weighting) {
            result += results[i] * (weighting[i] / total)
        }



        return result
    }

    //https://www.learndatasci.com/glossary/jaccard-similarity/
    //https://stats.stackexchange.com/questions/61705/similarity-coefficients-for-binary-data-why-choose-jaccard-over-russell-and-rao
    //https://stats.stackexchange.com/questions/58706/distance-metrics-for-binary-vectors
    //https://www.iiisci.org/journal/pdv/sci/pdfs/GS315JG.pdf

    jaccardSimilarity(vec1, vec2) {

        if (vec1.length != vec2.length) {
            console.log("Vec1 und Vec2 müssen gleich lang sein")
            return
        }

        var a = 0.0
        var b = 0.0
        var c = 0.0
        var d = 0.0

        for (var i in vec1) {

            if (vec1[i] == 1 && vec2[i] == 1) {
                a += 1
            }

            if (vec1[i] == 0 && vec2[i] == 1) {
                b += 1
            }

            if (vec1[i] == 0 && vec2[i] == 1) {
                c += 1
            }

            if (vec1[i] == 0 && vec2[i] == 0) {
                d += 1
            }

        }

        if(a+b+c == 0){
            return 0
        }

        // console.log(a)
        // console.log(b)
        // console.log(c)
        // console.log(d)


        return (a) / (a + b + c)


    }


    cosineSimilarity(vec1, vec2) { // geht nicht mit nur zero values

        const dotProduct = vec1.map((val, i) => (val) * (vec2[i])).reduce((accum, curr) => accum + curr, 0);
        const vec1Size = this.calcVectorSize(vec1);
        const vec2Size = this.calcVectorSize(vec2);

        return dotProduct / (vec1Size * vec2Size);
    } //https://gist.github.com/tomericco/14b5ceac90d6eed6f9ba6cb5305f8fab


    calcVectorSize(vec) {
        return Math.sqrt(vec.reduce((accum, curr) => accum + Math.pow(curr, 2), 0));
    } //https://gist.github.com/tomericco/14b5ceac90d6eed6f9ba6cb5305f8fab


}


module.exports = {
    Embedding
};