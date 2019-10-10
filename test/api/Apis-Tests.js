const express = require("express")
const http = require("http")
const assert = require("assert")
const Services = require("../../src/services/Services")
const Apis = require("../../src/api/Apis")

"use strict"

describe("Apis-Tests", () => {
    /** @type {Services} */
    let services
    beforeEach(async () => {
        services = new Services()
        services.auth = () => {
            return { currentUser: { id: "testUser" }, roles: ["admin"] }
        }
        services.register("hello").roles(["admin"]).argument({ hello: "required" }).action(async (context, argument) => {
            return argument
        })
        services.register("shit").roles(["admin"]).argument().action(async (context) => {
            throw new Error("shit")
        })

    })
    it("test-register", async () => {
        const router = express.Router()
        const apis = new Apis(services, router)
        apis.register("/hello").service("hello")
        apis.register("/shit").service("shit")
        const app = express()
        app.use(router)
        app.use((err, req, res, next) => {
            res.status(500)
            res.send({ error: true, message: err.message })
        })
        app.use((req, res, next) => {
            res.status(404)
            res.send({ error: true })
        })
        const server = http.createServer(app)
        await new Promise((resolve) => {
            server.listen(0, resolve)
        })
        const address = server.address()
        await new Promise((resolve) => {
            http.request({ ...address, path: "/hello?hello=world", method: "get" }, res => {
                const buffers = []
                res.on("end", () => {
                    assert(JSON.parse(Buffer.concat(buffers).toString()).hello == "world")
                    resolve()
                })
                res.on("data", (chunk) => {
                    buffers.push(chunk)
                })
            }).end()
        })
        await new Promise((resolve) => {
            http.request({ ...address, path: "/shit", method: "get" }, res => {
                const buffers = []
                res.on("end", () => {
                    assert(JSON.parse(Buffer.concat(buffers).toString()).message == "shit")
                    resolve()
                })
                res.on("data", (chunk) => {
                    buffers.push(chunk)
                })
            }).end()
        })
        await new Promise((resolve) => {
            http.request({ ...address, path: "/empty", method: "get" }, res => {
                assert(res.statusCode == 404)
                resolve()
            }).end()
        })
        server.close()
    })
})