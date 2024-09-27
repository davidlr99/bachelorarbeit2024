var data = { patient: [{ xyz: [{ a: 1 }, { a: 2 }, { a: 3 }] }, { xyz: [{ a: 4 }, { a: 5 }, { a: 6 }] }, { xyz: [{ a: 7 }, { a: 8 }, { a: 9 }] }] }
var key = ["patient", "*", "xyz", '*', 'a']



function rec(data, key, level) {

    var ck = key[level]

    if (key.length == level) {
        console.log(data)
        return data[ck]
    }

    level = level += 1


    if (ck != "*") {
        rec(data[ck], key, level)
    } else {
        for (var i = 0; i < data.length; i++) {
            rec(data[i], key, level)
        }
    }
}

var r = rec(data, key, 0)

var r = rec(data, ["patient"], 0)

console.log(r)
// function traverseWithKeyRec(data, currentKey,acc) {
//     if (currentKey.length == 0) {
//         console.log(acc)
//         return data
//     }


//     var key = currentKey[0]
//     currentKey.shift()

//     if (key == "*") {
//         for (var i = 0; i < data.length; i++) {
//             acc.push(traverseWithKeyRec(data[i], currentKey,acc))
//         }

//     } else {
//         return traverseWithKeyRec(data[key], currentKey,acc)
//     }

// }

// var res = traverseWithKeyRec(data, key,[])


// var finals = []
// function traverseWithKeyRec(key, currentKey, currentEntry, loop) {

//     console.log(currentKey)
//     console.log(currentEntry)
//     console.log(loop)


//     var the_key = key[currentKey]

//     console.log(the_key)

//     console.log("--------")


//     if (key.length - 1 == currentKey) {
//         console.log("Final: " + currentEntry[the_key])
//         finals.push(currentEntry[the_key])
//         return currentEntry[the_key]
//     }


//     if (!loop) {
//         currentKey++
//     }

//     if (the_key != "*") {
//         return traverseWithKeyRec(key, currentKey, currentEntry[the_key], loop)
//     } else {
//         for (var i = 0; i < currentEntry.length; i++) {
//             return traverseWithKeyRec(key, currentKey, currentEntry[i], !loop)
//         }

//     }


// }

// var res = traverseWithKeyRec(key, 0, data, false)
// console.log(res)

// console.log(finals)