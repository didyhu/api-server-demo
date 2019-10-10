const Knex = require("knex")
const assert = require("assert")
const Services = require("../../src/services/Services")
const UserService = require("../../src/services/UserService")
const UserDao = require("../../src/dao/UserDao")
const GroupDao = require("../../src/dao/GroupDao")

"use strict"

describe("UserService-Tests", () => {
    /** @type {Services} */
    let services
    beforeEach(async () => {
        let knex
        let userDao, groupDao
        knex = Knex({
            client: "sqlite3",
            connection: ":memory:"
        })
        userDao = new UserDao()
        await userDao.createTable(knex)
        groupDao = new GroupDao()
        await groupDao.createTable(knex)
        services = new Services({
            userDao, groupDao, knex,
        })
        services.auth = () => {
            return { currentUser: null, roles: ["admin"] }
        }
        services.on("error", error => {
            console.error(error)
        })
        UserService(services)

    })
    it("test-createUser", async () => {
        const user = { displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await services.get("createUser").execute(user, "username&password")
    })
    it("test-createGroup", async () => {
        const group = { groupName: "test", enabled: true }
        await services.get("createGroup").execute(group, "username&password")
    })
    it("test-getGroups", async () => {
        for (let i = 0; i < 10; i++) {
            const group = { groupName: "test" + i, enabled: true }
            await services.get("createGroup").execute(group, "username&password")
        }
        const results = await services.get("getGroups").execute()
        assert(results.length == 10)
    })
    it("test-setUserGroups", async () => {
        const user = { displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        const userId = await services.get("createUser").execute(user, "username&password")
        const group = { groupName: "test", enabled: true }
        const groupId = await services.get("createGroup").execute(group, "username&password")
        await services.get("setUserGroups").execute({ userId: userId, groupIds: [groupId] }, "username&password")
        const result = await services.get("getUser").execute({ userId })
    })
    it("test-getUsers", async () => {
        const group = { groupName: "test", enabled: true }
        const groupId = await services.get("createGroup").execute(group, "username&password")
        for (let i = 0; i < 10; i++) {
            const user = { displayName: "test", enabled: true, username: "username" + i, password: "password", role: "role" }
            const userId = await services.get("createUser").execute(user, "username&password")
            await services.get("setUserGroups").execute({ userId: userId, groupIds: [groupId] }, "username&password")
        }
        for (let i = 10; i < 20; i++) {
            const user = { displayName: "test", enabled: true, username: "username" + i, password: "password", role: "role" }
            const userId = await services.get("createUser").execute(user, "username&password")
        }
        const results = await services.get("getUsers").execute({ groupId })
        assert(results.length == 10)
        const results2 = await services.get("getUsers").execute({ page: 0 })
        assert(results2.totalElements == 20)
    })
})