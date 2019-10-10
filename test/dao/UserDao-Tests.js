const Knex = require("knex")
const assert = require("assert")
const uuid = require("uuid").v4
const UserDao = require("../../src/dao/UserDao")

"use strict"

describe("UserDao-Tests", () => {
    /** @type {Knex} */ let knex
    /** @type {UserDao} */ let userDao
    beforeEach(async () => {
        knex = Knex({
            client: "sqlite3",
            connection: ":memory:"
        })
        userDao = new UserDao()
        await userDao.createTable(knex)
    })
    it("test-create", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const result = await knex.table("user").first()
        for (const [key, val] of Object.entries(user)) {
            if (key !== "password") {
                assert(result[key] == val)
            }
        }
    })
    it("test-update", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const update = { displayName: "test2", password: "password2", enabled: undefined }
        await userDao.update(knex, user.id, update)
        const result = await knex.table("user").first()
        assert(result.displayName == update.displayName)
        assert(result.enabled == user.enabled)
    })
    it("test-delete", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        await userDao.delete(knex, user.id)
        const result = await knex.table("user").where({ deleted: false }).first()
        assert(result == null)
    })
    it("test-findOneById", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const result = await userDao.findOneById(knex, user.id)
        for (const [key, val] of Object.entries(user)) {
            if (key !== "password") {
                assert(result[key] == val)
            }
        }
    })
    it("test-findOneByUsernameAndPassword", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const result = await userDao.findOneByUsernameAndPassword(knex, user.username, user.password)
        for (const [key, val] of Object.entries(user)) {
            if (key !== "password") {
                assert(result[key] == val)
            }
        }
    })
    it("test-findAll", async () => {
        for (let i = 0; i < 10; i++) {
            const user = { id: uuid() + i, displayName: "test", enabled: true, username: "username" + i, password: "password", role: "role" }
            await userDao.create(knex, user)
        }
        const result = await userDao.findAll(knex, 2, 3)
        assert(result.totalElements == 10)
        assert(result.totalPages == 4)
        assert(result.page == 2)
        assert(result.pageSize == 3)
        assert(result.elements.length == 3)
    })
})