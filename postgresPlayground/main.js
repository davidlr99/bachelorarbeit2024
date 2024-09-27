const { Client } = require('pg')
const { Patients } = require("../indexPlayground/patients");

class PostgresPlayground {
    constructor(database = 'dnpm', user = 'postgres', password = 'postgres') {
        const client = new Client({
            user: "postgres",
            password: "postgres",
            database: "dnpm",
            host: "localhost",
            port: "5432",
        })

        this.client = client
        this.connected = false
    }
    async connect() {
        if (!this.connected) {
            await this.client.connect()
            this.connected = true
        }
    }
    async disconnect() {
        await this.client.end()
        this.connected = false
    }

    async query(query, values) {
        await this.connect()
        var res = await this.client.query(query, values)
        return res
    }

    async importData() {
        var patients = new Patients()
        var dataset = patients.loadPatients('./data/100_1720793940/')

        for (var i in dataset) {
            var patient = dataset[i].data
            await this.query("INSERT INTO patient (json) VALUES ($1);", [patient])
        }
    }


}

(async () => {
    var playground = new PostgresPlayground()
    // playground.importData()

    //Simple Variants
    var res = await playground.query(`
    select json->'patient'->>'id' from patient p where p.json @? '
        $.ngsReports.results[*].simpleVariants[*] 
            ? (@.gene.code == "HGNC:1100")
            ? (@.dnaChange.code == "c.148T>C") 
            ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")'
    `)

    //Simple Variants mit supporting

    var res = await playground.query(`
    SELECT json->'patient'->>'id' from (select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported, json FROM patient) p where 
    p.item @? '
    $
        ? (@.gene.code == "HGNC:1100")
        ? (@.dnaChange.code == "c.148T>C") 
        ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")' and
    p.supported @> (p.item->'id')::jsonb;
    `)

    //Mit inverted index etas komplizierter:

    //CREATE INDEX json_index ON patient USING gin (json);

    // @set jsoncond = '? (@.gene.code == "HGNC:1100") ? (@.dnaChange.code == "c.148T>C") ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")'

    // select json->'patient'->>'id' from (
    //     select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  
    //     jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported,
    //     json
    //     from (select * from patient where json @? ('
    //     $.ngsReports.results[*].simpleVariants[*] ' || :jsoncond)::jsonpath)) p 
    //    where
    //     p.item @? ('$' || :jsoncond)::jsonpath and
    //     p.supported @> (p.item->'id')::jsonb;


    //CNV

    var res = await playground.query(`
        select json->'patient'->>'id' from 
        (select json, jsonb_path_query(json,'$.ngsReports.results[*].copyNumberVariants[*]') as item
        from patient) p where 
        p.item  @> '{"type": {"code": "high-level-gain"},"reportedAffectedGenes":[{"code":"HGNC:3689"},{"code":"HGNC:5173"},{"code":"HGNC:1100"}]}'
        `)

    //CNV mit Supporting

    var res = await playground.query(`
        select json->'patient'->>'id' from 
        (select json, jsonb_path_query(json,'$.ngsReports.results[*].copyNumberVariants[*]') as item, 
        jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported
        from patient) p where 
        p.item  @> '{"type": {"code": "high-level-gain"},"reportedAffectedGenes":[{"code":"HGNC:3689"},{"code":"HGNC:5173"},{"code":"HGNC:1100"}]}'
        and p.supported @> (p.item->'id')::jsonb;
        `)


    //Diagnosen 
    var res = await playground.query(`
        select json->'patient'->>'id' from patient p where json @> '{"diagnoses":[{"code":{"code": "C60.0"}}]}';
        `)


    //Tumormorphologie
    var res = await playground.query(`
         select json->'patient'->>'id' from patient p where json @> '{"histologyReports":[{"results":{"tumorMorphology":{"value":{"code":"8800/0"}}}}]}';
        `)

    //Medikation - Einzeln
    var res = await playground.query(`
    select json->'patient'->>'id' from patient p where 
    json @> '{"therapies":[{"history":[{"medication":[{"display":"Elotuzumab"}]}]}]}'
    or json @> '{"therapies":[{"history":[{"medication":[{"display":"Omacetaxinmepesuccinat"}]}]}]}';
    `)


    //Medikation - Kombination

    var res = await playground.query(`select json->'patient'->>'id' from patient p where 
    json @> '{"therapies":[{"history":[{"medication":[{"display":"Elotuzumab"},{"display":"ElotuzumabTEST"}]}]}]}'`)


    console.log(res.rows)
    await playground.disconnect()

})();


//mongodb extra schema check für anfragen , postgres , evtl das NULL zurückkommt bzw leer zurückführen können auf entweder keine einträger oder fehlerhafte anfrage

//simpleVariants:

//SELECT * from (select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item FROM patient) p where p.item->'gene'->'code' @> '"HGNC:1097"';

// select id from patient p where jsonb_path_query_array( json, '$.ngsReports.results[*].simpleVariants[*].gene.code') @> '"HGNC:1097"';

//select id from patient p  where json @> '{"ngsReports":[{"results":{"simpleVariants":[{"gene":{"code":"HGNC:1097"}}]}}]}';

//select id from patient p  where json @> '{"ngsReports":[{"results":{"simpleVariants":[{"gene":{"code":"HGNC:1097"},"dnaChange":{"code":"c.353T>C"},"proteinChange":{"code":"p.Arg78_Gly79insX[23]"}}]}}]}';jsonb_path_query

//simpleVariants supporting:
// SELECT * from (select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported FROM patient) p where 
// p.item->'gene'->'code' @> '"HGNC:1100"' and 
// p.item->'dnaChange'->'code' @> '"c.148T>C"' and
// p.item->'proteinChange' ->'code' @> '"p.Cys28_Lys29delinsTrp"' and
// p.supported @> (p.item->'id')::jsonb;



//--select jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') from patient;

//explain analyse select id from patient p  where json @> '{"ngsReports":[{"results":{"simpleVariants":[{"gene":{"code":"HGNC:1097"},"dnaChange":{"code":"c.353T>C"},"proteinChange":{"code":"p.Arg78_Gly79insX[23]"}}]}}]}';

// --SELECT * from (select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported FROM patient) p where 
// --p.item->'gene'->'code' @> '"HGNC:1100"' and 
// --p.item->'dnaChange'->'code' @> '"c.148T>C"' and
// --p.item->'proteinChange' ->'code' @> '"p.Cys28_Lys29delinsTrp"' and
// --p.supported @> (p.item->'id')::jsonb;

// --CREATE INDEX test_index_4 
// --ON patient 
// --USING GIN ((json->'ngsReports') jsonb_path_ops);

// --select jsonb_path_query_array( json , '$.ngsReports.results[*].simpleVariants[*]' ) from patient p ;

// --CREATE INDEX test_index_3 
// --ON patient 
// --USING GIN (jsonb_path_query_array( json , '$.ngsReports.results[*].simpleVariants[*]' ));

// explain analyse select id from patient p where jsonb_path_query_array( json , '$.ngsReports.results[*].simpleVariants[*]' ) @> '[{"gene":{"code":"HGNC:1097"}}]';

// EXPLAIN ANALYZE select p.* from patient p where p.json @? '
// $.ngsReports.results[*].simpleVariants[*] 
// ? (@.gene.code == "HGNC:1100")
// ? (@.dnaChange.code == "c.148T>C") 
// ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")'

// explain analyse select id from patient p where p.json->'patient'->'id' @> '"k"';

// set enable_seqscan = off;
// explain analyse select id from patient p where json @> '{}';

// select json->'patient'->'id' from patient p;

// CREATE INDEX text_index_7
// ON patient 
// USING GIN ((json->'patient'));
// --';


// explain analyse select * from (
//     select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  
//     jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported 
//     from (select * from patient where json @? '
//    $.ngsReports.results[*].simpleVariants[*] 
//     ? (@.gene.code == "HGNC:1100")
//     ? (@.dnaChange.code == "c.148T>C") 
//    ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")')) p 
//    where
//    p.item->'gene'->'code' @> '"HGNC:1100"' and 
//    p.item->'dnaChange'->'code' @> '"c.148T>C"' and
//    p.item->'proteinChange' ->'code' @> '"p.Cys28_Lys29delinsTrp"' and
//    p.supported @> (p.item->'id')::jsonb;



//CNV: select * from (select json, jsonb_path_query(json,'$.ngsReports.results[*].copyNumberVariants[*].reportedAffectedGenes') as item from patient) p where p.item  @> '[{"code":"HGNC:3689"},{"code":"HGNC:5173"},{"code":"HGNC:6407"}]'





//CREATE INDEX json_index ON patient USING gin (json);

// @set jsoncond = '? (@.gene.code == "HGNC:1100") ? (@.dnaChange.code == "c.148T>C") ? (@.proteinChange.code == "p.Cys28_Lys29delinsTrp")'

// select * from (
//     select jsonb_path_query(json,'$.ngsReports.results[*].simpleVariants[*]') as item ,  
//     jsonb_path_query_array(json,'$.carePlans[*].medicationRecommendations[*].supportingVariants[*].id') as supported 
//     from (select * from patient where json @? ('
//     $.ngsReports.results[*].simpleVariants[*] ' || :jsoncond)::jsonpath)) p 
//    where
//     p.item @? ('$' || :jsoncond)::jsonpath and
//     p.supported @> (p.item->'id')::jsonb;

