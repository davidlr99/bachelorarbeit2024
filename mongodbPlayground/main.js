const { Patients } = require("../indexPlayground/patients");

const { MongoClient } = require('mongodb');


//B-Tree https://www.mongodb.com/docs/v5.3/indexes/#footnote-b-tree
// warum nicht auf Filter: https://www.mongodb.com/community/forums/t/index-on-filter/182718
class MongoDbPlayground {
  constructor(url = "mongodb://localhost:27017", dbName = "dnpm", collectionName = "patients") {
    this.url = url
    this.dbName = dbName
    this.collectionName = collectionName

    this.client = new MongoClient(url)
    this.connected = false
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect()
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection(this.collectionName);
      this.connected = true
    }
  }

  async disconnect() {
    await this.client.close()
    this.connected = false
  }

  async importData() {

    await this.connect()

    var patients = new Patients()
    var dataset = patients.loadPatients('./data/100_1720793940/')

    for (var i in dataset) {
      var patient = dataset[i].data
      await collection.insertOne(patient);
    }

  }

  async createIndex() {
    await this.connect()
    this.collection.createIndex(
      {
        "ngsReports.results.simpleVariants.gene.code": 1,
        "ngsReports.results.simpleVariants.dnaChange.code": 1,
        "ngsReports.results.simpleVariants.proteinChange.code": 1
      })
  }

  async query(query, aggregate = false) {

    await this.connect()

    var res;
    if (!aggregate) {
      res = await this.collection.find(query)
    } else {
      res = await this.collection.aggregate(query)
    }

    res = await res.project({ "patient.id": 1 }).toArray()

    return res
  }


}


(async () => {

  var playground = new MongoDbPlayground()

  playground.createIndex()

  var res;

  //SimpleVariants ohne Supporting
  var geneName = "HGNC:1097"
  var dnaChange = "c.353T>C"
  var proteinChange = "p.Arg78_Gly79insX[23]"
  res = await playground.query(
    {
      "ngsReports.results.simpleVariants":
      {
        $elemMatch: {
          "gene.code": geneName,
          "dnaChange.code": dnaChange,
          "proteinChange.code": proteinChange
        }
      }
    })


  // console.log(res)


  //SimpleVariants mit Supporting

  geneName = 'HGNC:1100'
  dnaChange = 'c.148T>C'
  proteinChange = 'p.Cys28_Lys29delinsTrp'

  // JSON baumartig aber nicht dafür ausgelegt auflösen von Referenzen (graphenartig) => gibt es in Baumstruktur nicht , Sprache die auf JSON aufbazt schlecte graphenoperationen
  //noch in dikussion aufneghmen das das JSON objekt mit supporting true/false geändert wird  
  //in diskussion bäume vs graphen im Bezug zu Datenmodel 
  //schema und read, schema on write
  // => um gut zu machen json model anpassen 
  res = await playground.query(
    [
      {
        $match: {
          "ngsReports.results.simpleVariants":
          {
            $elemMatch: {
              "gene.code": geneName,
              "dnaChange.code": dnaChange,
              "proteinChange.code": proteinChange
            }
          }
        }
      },
      { $unwind: '$ngsReports' },
      { $unwind: '$carePlans' },
      { $unwind: '$carePlans.medicationRecommendations' },
      {
        $match: {
          $expr: {
            $eq: [
              {
                $size: {
                  $filter: {
                    input: "$ngsReports.results.simpleVariants", //desshalb unwind davor => mongodb löst nur hier nur Notation auf wenn kein verschachteles array
                    as: "item",
                    cond: {
                      $and: [
                        { $eq: ["$$item.gene.code", geneName] }, //warum hier nochmal => mongodb matcht nur documente die match von oben erfüllen aber es sind ja noch die anderen simpleVariants drin (in den Dokumenten die Bedingung erfüllen)
                        { $eq: ["$$item.dnaChange.code", dnaChange] },
                        { $eq: ["$$item.proteinChange.code", proteinChange] },
                        {
                          $in: ["$$item.id", { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$$simpleVariant.id" } }]
                        }
                      ]
                    }
                  }
                }
              },
              1
            ]
          }
        }
      },
    ],
    true)

  console.log(res)

  //copyNumberVariants

  var geneSubset = ["HGNC:1097", "HGNC:6973", "HGNC:391"]
  var type = "low-level-gain"

  res = await playground.query([
    {
      $match: {
        "ngsReports.results.copyNumberVariants":
        {
          $elemMatch: {
            "reportedAffectedGenes.code": { $all: geneSubset },
            "type.code": type,
          }
        }
      }
    }
  ], true)

  // console.log(res)

  //copyNumberVariants mit Supporting

  geneSubset = ["HGNC:3689", "HGNC:5173", "HGNC:1100"]
  type = "high-level-gain"

  res = await playground.query([
    {
      $match: {
        "ngsReports.results.copyNumberVariants":
        {
          $elemMatch: {
            "reportedAffectedGenes.code": { $all: geneSubset },
            "type.code": type,
          }
        }
      }
    },
    { $unwind: '$ngsReports' },
    { $unwind: '$carePlans' },
    { $unwind: '$carePlans.medicationRecommendations' },
    {
      $match: {
        $expr: {
          $eq: [
            {
              $size: {
                $filter: {
                  input: "$ngsReports.results.copyNumberVariants",
                  as: "item",
                  cond: {
                    $and: [
                      { $eq: ["$$item.type.code", type] },
                      { $setIsSubset: [geneSubset, { $map: { input: "$$item.reportedAffectedGenes", as: "gene", in: "$$gene.code" } }] },
                      {
                        $in: ["$$item.id", { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$$simpleVariant.id" } }]
                      }
                    ]
                  }
                }
              }
            },
            1
          ]
        }
      }
    },
  ],
    true)


  // console.log(res)


  //Diagnoses

  var diagnoses = ['C60.0']

  res = await playground.query([
    {
      $match: {
        "diagnoses.code.code": { $in: diagnoses }
      }
    }
  ], true)


  // console.log(res)


  //tumorMorphology

  var tumorMorphologies = ["8800/0"]

  res = await playground.query([
    {
      $match: {
        "histologyReports.results.tumorMorphology.value.code": { $in: tumorMorphologies }
      }
    }
  ], true)

  // console.log(res)



  //medicationInTherapy


  var medications = ["Elotuzumab"]

  res = await playground.query([
    {
      $match: {
        "therapies.history.medication.display": { $in: medications }
      }
    }
  ], true)

  // console.log(res)



  await playground.disconnect()



  //medicationInTherapy combined 



  var medications = ["Elotuzumab", "ElotuzumabTEST"]

  res = await playground.query([
    {
      $match: {
        "therapies.history.medication.display": { $all: medications }
      }
    }
  ], true)

  // console.log(res)


  //Anmerkung: für guidelineTherapies analog...


  //Response


  var responses = ["CR"]

  res = await playground.query([
    {
      $match: {
        "responses.value.code": { $in: responses }
      }
    }
  ], true)

  // console.log(res)

  await playground.disconnect()


})();

// // importData()


// async function getPatientsWithSNV(geneName, dnaChange, proteinChange) {

//   await client.connect();
//   const db = client.db(dbName);
//   const collection = db.collection('patients');


//   var res = await collection.find({
//     "ngsReports.results.simpleVariants":
//     {
//       $elemMatch: {
//         "gene.code": geneName,
//         "dnaChange.code": dnaChange,
//         "proteinChange.code": proteinChange
//       }
//     }
//   }
//   ).project({ "patient.id": 1 }).toArray()

//   console.log(res)


//   await client.close()

//   return res

// }


// // getPatientsWithSNV("HGNC:1097", "c.353T>C", "p.Arg78_Gly79insX[23]")







// async function getPatientsWithSNVSupporting(geneName, dnaChange, proteinChange) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "ngsReports.results.simpleVariants":
//         {
//           $elemMatch: {
//             "gene.code": geneName,
//             "dnaChange.code": dnaChange,
//             "proteinChange.code": proteinChange
//           }
//         }
//       }
//     },
//     { $unwind: '$ngsReports' },
//     { $unwind: '$carePlans' },
//     { $unwind: '$carePlans.medicationRecommendations' },
//     {
//       $match: {
//         $expr: {
//           $eq: [
//             {
//               $size: {
//                 $filter: {
//                   input: "$ngsReports.results.simpleVariants", //desshalb unwind davor => mongodb löst nur hier nur Notation auf wenn kein verschachteles array
//                   as: "item",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$item.gene.code", geneName] }, //warum hier nochmal => mongodb matcht nur documente die match von oben erfüllen aber es sind ja noch die anderen simpleVariants drin (in den Dokumenten die Bedingung erfüllen)
//                       { $eq: ["$$item.dnaChange.code", dnaChange] },
//                       { $eq: ["$$item.proteinChange.code", proteinChange] },
//                       {
//                         $in: ["$$item.id", { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$$simpleVariant.id" } }]
//                       }
//                     ]
//                   }
//                 }
//               }
//             },
//             1
//           ]
//         }
//       }
//     },
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res

// }


// // getPatientsWithSNVSupporting('HGNC:1100', 'c.148T>C', 'p.Cys28_Lys29delinsTrp')
// // getPatientsWithSNVSupporting('HGNC:6973', 'c.92T>A', 'p.(Pro578_Lys579delinsLeuTer)')

// // getPatientsWithSNVSupporting("HGNC:1097", "c.353T>C", "p.Arg78_Gly79insX[23]")



// async function getPatientsWithCNV(geneSubset, type) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "ngsReports.results.copyNumberVariants":
//         {
//           $elemMatch: {
//             "reportedAffectedGenes.code": { $all: geneSubset },
//             "type.code": type,
//           }
//         }
//       }
//     }
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res

// }

// // getPatientsWithCNV(["HGNC:1097", "HGNC:6973","HGNC:391"],"low-level-gain")
// // getPatientsWithCNV(["HGNC:5173", "HGNC:6407","HGNC:1100"],"high-level-gain")



// async function getPatientsWithCNVSupporting(geneSubset, type) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "ngsReports.results.copyNumberVariants":
//         {
//           $elemMatch: {
//             "reportedAffectedGenes.code": { $all: geneSubset },
//             "type.code": type,
//           }
//         }
//       }
//     },
//     { $unwind: '$ngsReports' },
//     { $unwind: '$carePlans' },
//     { $unwind: '$carePlans.medicationRecommendations' },
//     {
//       $match: {
//         $expr: {
//           $eq: [
//             {
//               $size: {
//                 $filter: {
//                   input: "$ngsReports.results.copyNumberVariants",
//                   as: "item",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$item.type.code", type] },
//                       { $setIsSubset: [geneSubset, { $map: { input: "$$item.reportedAffectedGenes", as: "gene", in: "$$gene.code" } }] },
//                       {
//                         $in: ["$$item.id", { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$$simpleVariant.id" } }]
//                       }
//                     ]
//                   }
//                 }
//               }
//             },
//             1
//           ]
//         }
//       }
//     },
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res

// }

// // getPatientsWithCNVSupporting(["HGNC:11998","HGNC:3690"], "low-level-gain")
// // getPatientsWithCNVSupporting(["HGNC:3689", "HGNC:5173", "HGNC:1100"], "high-level-gain")


// async function getPatientsWithDiagnose(diagnoses) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "diagnoses.code.code": { $in: diagnoses }
//       }
//     }
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res

// }

// // getPatientWithDiagnose(['C60.0'])



// async function getPatientsWithTumormorphology(morphologyCodes) {
//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "histologyReports.results.tumorMorphology.value.code": { $in: morphologyCodes }
//       }
//     }
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res
// }

// // getPatientsWithTumormorphology(["8800/0"])


// async function getPatientsWithMedicationInTherapy(medications) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "therapies.history.medication.display": { $in: medications }
//       }
//     }
//   ],
//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)
//   await client.close()

//   return res

// }

// getPatientsWithMedicationInTherapy(["Elotuzumab"])




// {
//   $match: {
//     $expr: {
//       $eq: [
//         {
//           $size: {
//             $setIntersection: [
//               ["$ngsReports.results.simpleVariants.id"],
//               { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$simpleVariant.id" } }
//             ]
//           }
//         },
//         1
//       ]
//     }
//   }
// }


// async function getPatientsWithSNVSupporting(geneName, dnaChange, proteinChange) {

//   const db = client.db(dbName);
//   const collection = db.collection('patients');

//   var res = await collection.aggregate([
//     {
//       $match: {
//         "ngsReports.results.simpleVariants":
//         {
//           $elemMatch: {
//             "gene.code": geneName,
//             "dnaChange.code": dnaChange,
//             "proteinChange.code": proteinChange
//           }
//         }
//       }
//     },
//     {
//       $match: {
//         $expr: {
//           $eq: [
//             {
//               $size: {
//                 $setIntersection: [
//                   { $map: { input: "$ngsReports.results.simpleVariants", as: "simpleVariant", in: "$simpleVariant.id" } },
//                   { $map: { input: "$carePlans.medicationRecommendations.supportingVariants", as: "simpleVariant", in: "$simpleVariant.id" } }
//                 ]
//               }
//             },
//             1
//           ]
//         }
//       }
//     }

//   ],

//   ).project({ "patient.id": 1 }).toArray()


//   console.log(res)

//   await client.close()

//   return res

// }
