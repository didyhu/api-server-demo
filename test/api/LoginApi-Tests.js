const express = require("express")
const http = require("http")
const assert = require("assert")
const Knex = require("knex")
const bodyParser = require("body-parser")
const Services = require("../../src/services/Services")
const Apis = require("../../src/api/Apis")
const LoginService = require("../../src/services/LoginService")
const UserDao = require("../../src/dao/UserDao")

"use strict"

describe("LoginApi-Tests", () => {
    /** @type {Knex} */ let knex
    /** @type {Services} */ let services
    /** @type {UserDao} */  let userDao
    beforeEach(async () => {
        knex = Knex({
            client: "sqlite3",
            connection: ":memory:"
        })
        userDao = new UserDao()
        await userDao.createTable(knex)
        services = new Services({
            userDao, knex,
        })
        LoginService(services)

    })
    it("test-register", async () => {
        const user = {
            id: "admin", displayName: "test", enabled: true, username: "admin", password: "password", role: "admin"
        }
        await userDao.create(knex, user)
        const router = express.Router()
        const apis = new Apis(services, router)
        apis.register("/login").service("login")
        const app = express()
        app.use(bodyParser.json())
        app.use(router)
        const server = http.createServer(app)
        await new Promise((resolve, reject) => {
            server.listen(0, () => {
                const address = server.address()
                const req = http.request({
                    ...address, path: "/login", method: "post", headers: {
                        "content-type": "application/json"
                    }
                }, res => {
                    const buffers = []
                    res.on("end", () => {
                        assert(Buffer.concat(buffers).toString() == `["admin","password"]`)
                        server.close()
                        resolve()
                    })
                    res.on("data", (chunk) => {
                        buffers.push(chunk)
                    })
                })
                req.write(JSON.stringify({ username: "admin", password: "password" }))
                req.end()
            })
        })
    })
})