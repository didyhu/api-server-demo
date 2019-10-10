const express = require("express")
const Services = require("../services/Services")

class Apis {
    /**
     * @param {Services} services
     * @param {express.Router} router
     */
    constructor(services, router) {
        this._services = services
        this._router = router
        this._map = new Map()
    }
    register(name) {
        return {
            service: (serviceName = name) => {
                const service = this._services.get(serviceName)
                this._router.all(name, (req, res, next) => {
                    const argument = { ...req.body, ...req.query }
                    const login = req.headers.authorization
                    service.execute(argument, login)
                        .then(result => {
                            if (typeof result == "object") {
                                res.send(JSON.stringify(result))
                            } else {
                                res.send(result)
                            }
                        })
                        .catch(next)

                })
            }
        }
    }
}
module.exports = Apis
