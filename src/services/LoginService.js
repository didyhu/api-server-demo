const Knex = require("knex")
const Services = require("./Services")
const UserDao = require("../dao/UserDao")

"use strict"

module.exports =
    /**
     * @param {Services} services
     */
    (services) => {
        services.auth = async (authorization) => {
            if (!authorization) {
                return { currentUser: null, roles: ["guest"] }
            } else {
                const [username, password] = JSON.parse(authorization)
                const { knex, userDao } = services._context
                const user = await userDao.findOneByUsernameAndPassword(knex, username, password)
                if (!user) {
                    throw new Error("用户名密码不匹配")
                }
                return {
                    currentUser: user,
                    roles: [user.role]
                }
            }
        }
        services
            .register("login")
            .roles(["admin", "user", "guest"])
            .argument({ username: "required", password: "required" })
            .action(
                /**
                 * @param {Object} context
                 * @param {Knex} context.knex
                 * @param {UserDao} context.userDao
                 */
                async ({ knex, userDao }, { username, password }) => {
                    const user = await userDao.findOneByUsernameAndPassword(knex, username, password)
                    if (!user) {
                        throw new Error("用户名密码不匹配")
                    }
                    return JSON.stringify([username, password])
                })
        services
            .register("who")
            .roles(["admin", "user", "guest"])
            .argument()
            .action(
                /**
                 * @param {Object} context
                 * @param {Object} context.currentUser
                 * @param {Array.<string>} context.roles
                 */
                async ({ currentUser, roles }) => {
                    return { currentUser, roles }
                })
    }