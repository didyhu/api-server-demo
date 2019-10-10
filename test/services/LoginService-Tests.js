const Knex = require("knex")
const assert = require("assert")
const Services = require("../../src/services/Services")
const LoginService = require("../../src/services/LoginService")
const UserDao = require("../../src/dao/UserDao")

"use strict"

describe("LoginService-Tests", () => {
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
    it("test-login", async () => {
        const user = {
            id: "admin", displayName: "test", enabled: true, username: "admin", password: "password", role: "admin"
        }
        await userDao.create(knex, user)
        const login = await services.get("login").execute({ username: "admin", password: "password" })
        const result = await services.get("who").execute(null, login)
        assert(result.roles[0] == "admin")
    })
})