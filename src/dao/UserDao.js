const Knex = require("knex")

"use strict"

class User {
    constructor() {
        /** @type {string}  @column {uuid}      */ this.id
        /** @type {number}  @column {timestamp} */ this.createTime
        /** @type {number}  @column {timestamp} */ this.updateTime
        /** @type {boolean} @column {boolean}   */ this.enabled
        /** @type {boolean} @column {boolean}   */ this.deleted
        /** @type {string}  @column {string}    */ this.username
        /** @type {string}  @column {string}    */ this.password
        /** @type {string}  @column {string}    */ this.role
        /** @type {string}  @column {string}    */ this.displayName
    }
}

class UserDao {
    /**
     * 
     * @param {Knex} knex 
     */
    async createTable(knex) {
        if (!await knex.schema.hasTable("user")) {
            await knex.schema.createTable("user", table => {
                User.toString().split("\n").map(line => line.trim())
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
                            case "username": {
                                column.unique()
                                break
                            }
                        }
                    })
                table.index(["deleted", "createTime"])
            })
        }
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {Object} create
     * @param {string} create.id
     * @param {boolean} create.enabled
     * @param {string} create.username
     * @param {string} create.password
     * @param {string} create.displayName
     * @param {string} create.role
     */
    async create(knex, { id, enabled, username, password, displayName, role }) {
        const createTime = Date.now(),
            updateTime = Date.now(),
            deleted = false
        await knex.table("user").insert({
            id, enabled, username, password, displayName, role,
            createTime, updateTime, deleted
        })
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} id
     * @param {Object} update
     * @param {boolean} update.enabled
     * @param {string} update.password
     * @param {string} update.displayName
     * @param {string} update.role
     */
    async update(knex, id, { enabled, password, displayName, role }) {
        const update = Object.fromEntries(Object.entries({ enabled, password, displayName, role }).filter(([key, val]) => val !== undefined))
        await knex.table("user").where({ id }).update(update)
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} id 
     */
    async delete(knex, id) {
        await knex.table("user").where({ id }).update({ deleted: true })
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} id 
     */
    async findOneById(knex, id) {
        return this._safe(await knex.table("user").where({ id, deleted: false }).first())
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {string} username 
     * @param {string} password 
     */
    async findOneByUsernameAndPassword(knex, username, password) {
        return this._safe(await knex.table("user").where({ username, password, deleted: false }).first())
    }
    /**
     * 
     * @param {Knex} knex 
     * @param {number} page 
     * @param {number} pageSize 
     */
    async findAll(knex, page, pageSize) {
        const { count } = await knex.table("user").count("id as count").where({ deleted: false }).first()
        let limit = pageSize,
            offset = page * pageSize
        const elements = await knex.table("user").where({ deleted: false }).offset(offset).limit(limit).orderBy("createTime", "desc").map(this._safe)
        return {
            totalElements: count,
            totalPages: Math.ceil(count / pageSize),
            page,
            pageSize,
            elements
        }
    }
    _safe(user) {
        if (user) {
            delete user.password
        }
        return user
    }
}

module.exports = UserDao