const Knex = require("knex")

"use strict"

class Group {
    constructor() {
        /** @type {string} @column {uuid}       */ this.id
        /** @type {string} @column {string}     */ this.groupName
        /** @type {number}  @column {timestamp} */ this.createTime
        /** @type {number}  @column {timestamp} */ this.updateTime
        /** @type {boolean} @column {boolean}   */ this.enabled
        /** @type {boolean} @column {boolean}   */ this.deleted
    }
}

class GroupUser {
    constructor() {
        /** @type {string} @column {uuid}       */ this.userId
        /** @type {string} @column {uuid}       */ this.groupId
    }
}


class GroupDao {
    /**
     * 
     * @param {Knex} knex 
     */
    async createTable(knex) {
        if (!await knex.schema.hasTable("group")) {
            await knex.schema.createTable("group", table => {
                Group.toString().split("\n").map(line => line.trim())
                    .map(line => line.match(/@type {.*?}\s*@column {(.*)}.*this\.(.*)/))
                    .filter(array => array)
                    .forEach(array => {
                        const [, type, name] = array
                        let column = table[type](name).notNullable()
                        switch (name) {
                            case "id": {
                                column.primary()
                                break
                            }
                        }
                    })
                table.index(["deleted", "createTime"])
            })
        }
        if (!await knex.schema.hasTable("group-user")) {
            await knex.schema.createTable("group-user", table => {
                GroupUser.toString().split("\n").map(line => line.trim())
                    .map(line => line.match(/@type {.*?}\s*@column {(.*)}.*this\.(.*)/))
                    .filter(array => array)
                    .forEach(array => {
                        const [, type, name] = array
                        table[type](name).notNullable()
                    })
                table.unique(["userId", "groupId"])
            })
        }
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {Object} create
     * @param {string} create.id
     * @param {string} create.groupName
     * @param {boolean} create.enabled
     */
    async create(knex, { id, groupName, enabled }) {
        const createTime = Date.now(),
            updateTime = Date.now(),
            deleted = false
        await knex.table("group").insert({
            id, groupName, enabled,
            createTime, updateTime, deleted
        })
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} id
     * @param {Object} update
     * @param {string} update.groupName
     * @param {boolean} update.enabled
     */
    async update(knex, id, { groupName, enabled }) {
        const update = Object.fromEntries(Object.entries({ enabled, groupName }).filter(([key, val]) => val !== undefined))
        await knex.table("group").where({ id }).update(update)
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} id 
     */
    async delete(knex, id) {
        await knex.table("group").where({ id }).update({ deleted: true })
    }
    /**
     * 
     * @param {Knex} knex 
     */
    async findAll(knex) {
        return knex.table("group").where({ deleted: false })
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} groupId 
     * @param {string} userId 
     */
    async addUser(knex, groupId, userId) {
        await knex.table("group-user").insert({ groupId, userId })
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} groupId 
     * @param {string} userId 
     */
    async removeUser(knex, groupId, userId) {
        await knex.table("group-user").where({ groupId, userId }).delete()
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} groupId 
     */
    async findUsersByGroupId(knex, groupId) {
        return await knex.table("user AS u").leftJoin("group-user AS gu", "u.id", "=", "gu.userId")
            .leftJoin("group AS g", "g.id", "=", "gu.groupId")
            .where("gu.groupId", groupId).andWhere("g.deleted", false).andWhere("u.deleted", false).select("u.*")
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} userId 
     */
    async findGroupsByUserId(knex, userId) {
        return await knex.table("user AS u").leftJoin("group-user AS gu", "u.id", "=", "gu.userId")
            .leftJoin("group AS g", "g.id", "=", "gu.groupId")
            .where("u.id", userId).andWhere("g.deleted", false).andWhere("u.deleted", false).select("g.*")
    }
}

module.exports = GroupDao