const Knex = require("knex")
const assert = require("assert")
const uuid = require("uuid").v4
const GroupDao = require("../../src/dao/GroupDao")
const UserDao = require("../../src/dao/UserDao")

"use strict"

describe("GroupDao-Tests", () => {
    /** @type {Knex} */ let knex
    /** @type {GroupDao} */ let groupDao
    /** @type {UserDao} */ let userDao
    beforeEach(async () => {
        knex = Knex({
            client: "sqlite3",
            connection: ":memory:"
        })
        groupDao = new GroupDao()
        userDao = new UserDao()
        await groupDao.createTable(knex)
        await userDao.createTable(knex)
    })
    it("test-create", async () => {
        await groupDao.create(knex, { id: uuid(), groupName: "test", enabled: true })
        const result = await knex.table("group").first()
        assert(result.groupName == "test")
    })
    it("test-update", async () => {
        const id = uuid()
        await groupDao.create(knex, { id, groupName: "test", enabled: true })
        await groupDao.update(knex, id, { groupName: "test2" })
        const result = await knex.table("group").first()
        assert(result.groupName == "test2")
    })
    it("test-delete", async () => {
        const id = uuid()
        await groupDao.create(knex, { id, groupName: "test", enabled: true })
        await groupDao.delete(knex, id)
        const result = await knex.table("group").first()
        assert(result.deleted == true)
    })
    it("test-findAll", async () => {
        for (let i = 0; i < 10; i++) {
            const id = uuid() + i
            await groupDao.create(knex, { id, groupName: "test", enabled: true })
        }
        const results = await groupDao.findAll(knex)
        assert(results.length == 10)
    })
    it("test-addUser", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const id = uuid()
        await groupDao.create(knex, { id, groupName: "test", enabled: true })
        await groupDao.addUser(knex, id, user.id)
        const results = await knex.table("group-user").where({ groupId: id, userId: user.id })
        assert(results.length == 1)
    })
    it("test-removeUser", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        const id = uuid()
        await groupDao.create(knex, { id, groupName: "test", enabled: true })
        await groupDao.addUser(knex, id, user.id)
        await groupDao.removeUser(knex, id, user.id)
        const results = await knex.table("group-user").where({ groupId: id, userId: user.id })
        assert(results.length == 0)
    })
    it("test-findGroupsByUserId", async () => {
        const user = { id: uuid(), displayName: "test", enabled: true, username: "username", password: "password", role: "role" }
        await userDao.create(knex, user)
        for (let i = 0; i < 10; i++) {
            const groupId = uuid()
            await groupDao.create(knex, { id: groupId, groupName: "test" + i, enabled: true })
            await groupDao.addUser(knex, groupId, user.id)
        }
        const results = await groupDao.findGroupsByUserId(knex, user.id)
        assert(results.length == 10)
    })
    it("test-findUsersByGroupId", async () => {
        const groupId = uuid()
        await groupDao.create(knex, { id: groupId, groupName: "test", enabled: true })
        for (let i = 0; i < 10; i++) {
            const user = { id: uuid() + i, displayName: "test", enabled: true, username: "username" + i, password: "password", role: "role" }
            await userDao.create(knex, user)
            await groupDao.addUser(knex, groupId, user.id)
        }
        const results = await groupDao.findUsersByGroupId(knex, groupId)
        assert(results.length == 10)
    })
})