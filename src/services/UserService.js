const Knex = require("knex")
const uuid = require("uuid").v4
const Services = require("./Services")
const UserDao = require("../dao/UserDao")
const GroupDao = require("../dao/GroupDao")

"use strict"

module.exports =
    /**
     * @param {Services} services
     */
    (services) => {
        services
            .register("createGroup")
            .roles(["admin"])
            .argument({ enabled: "required", groupName: "required" })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {UserDao} context.userDao
                 * @param {GroupDao} context.groupDao
                 */
                async ({ knex, userDao, groupDao }, { enabled, groupName }) => {
                    const id = uuid()
                    await groupDao.create(knex, { id, enabled, groupName })
                    return id
                })

        services
            .register("createUser")
            .roles(["admin"])
            .argument({ enabled: "required", username: "required", password: "required", displayName: "required", role: "required" })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {UserDao} context.userDao
                 */
                async ({ knex, userDao }, { enabled, username, password, displayName, role }) => {
                    const id = uuid()
                    await userDao.create(knex, { id, enabled, username, password, displayName, role })
                    return id
                })

        services
            .register("getUser")
            .roles(["admin", "user"])
            .argument({ userId: "required" })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {UserDao} context.userDao
                 * @param {GroupDao} context.groupDao
                 */
                async ({ knex, userDao, groupDao }, { userId }) => {
                    const user = await userDao.findOneById(knex, userId)
                    const groups = await groupDao.findGroupsByUserId(knex, userId)
                    user.groups = groups
                    return user
                })

        services
            .register("getUsers")
            .roles(["admin", "user"])
            .argument({ groupId: null, page: null })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {UserDao} context.userDao
                 * @param {GroupDao} context.groupDao
                 */
                async ({ knex, userDao, groupDao }, { page, groupId = undefined } = {}) => {
                    if (groupId == undefined) {
                        return await userDao.findAll(knex, page, 100)
                    } else {
                        return await groupDao.findUsersByGroupId(knex, groupId)
                    }
                })

        services
            .register("getGroups")
            .roles(["admin", "user"])
            .argument()
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {GroupDao} context.groupDao
                 */
                async ({ knex, userDao, groupDao }) => {
                    return await groupDao.findAll(knex)
                })

        services
            .register("setUserGroups")
            .roles(["admin"])
            .argument({ userId: "required", groupIds: "required" })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {GroupDao} context.groupDao
                 */
                async ({ knex, groupDao }, { userId, groupIds }) => {
                    const groups = await groupDao.findGroupsByUserId(knex, userId)
                    for (const group of groups) {
                        await groupDao.removeUser(knex, group.id, userId)
                    }
                    for (const groupId of groupIds) {
                        await groupDao.addUser(knex, groupId, userId)
                    }
                })
    }