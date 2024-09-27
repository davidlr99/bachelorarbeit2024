const neo4j = require('neo4j-driver')



class Neo4j {
    constructor(address, dbName, username, password) {
        this.address = address
        this.dbName = dbName
        this.username = username
        this.password = password
        this.driver = undefined
        this.session = undefined
    }
    async close(){
        this.session.close()
        this.driver.close()
        this.driver = undefined
        this.session = undefined
    }
    async connect() {
        if (this.driver != undefined) {
            return
        }
        this.driver = neo4j.driver(this.address, neo4j.auth.basic(this.username, this.password))
        const serverInfo = await this.driver.getServerInfo()
        this.session = this.driver.session({ database: this.dbName })
        console.log('Connection established')
        console.log(serverInfo)
    }

    async query(query, variables) {
        await this.connect()
        const { records, summary, keys } = await this.session.run(query, variables)

        return records
    }

}

module.exports = {
    Neo4j
};