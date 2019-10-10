const events = require("events")

"use strict"

class ServiceException extends Error {
    constructor(message = "错误的服务调用", origin) {
        super(message)
        this.origin = origin
    }
}
/**
 * @emits error
 */
class Services extends events.EventEmitter {
    constructor(context) {
        super()
        this.map = new Map()
        this._context = context
        this._auth = ()=>{return {currentUser:null,roles:["guest"]}}
    }
    get context() {
        return this._context
    }
    set auth(auth){
        this._auth=auth
    }
    register(name) {
        return {
            roles: (roles) => {
                return {
                    argument: (argument) => {
                        return {
                            action: (action) => {
                                this.map.set(name, {
                                    name, roles, argument, action
                                })
                            }
                        }
                    }
                }
            }
        }
    }
    get(name) {
        if (!this.map.has(name)) {
            throw new ServiceException()
        }
        const service = this.map.get(name)
        return {
            execute: async (argument={}, authorization) => {
                const { roles, currentUser } = await this._auth(authorization)
                if (!service.roles.find(r1 => roles.find(r2 => r2 == r1))) {
                    throw new ServiceException("权限错误")
                }
                const context = { ...this.context, roles, currentUser }
                const result= await service.action(context,
                    service.argument && Object.fromEntries(Object.entries(service.argument).map(([key, valid]) => {
                        if (typeof valid == "function") {
                            if (!valid(argument[key])) {
                                throw new ServiceException("参数错误"+key)
                            }
                        } else if (valid == "required") {
                            if (argument[key] == undefined) {
                                throw new ServiceException("参数错误"+key)
                            }
                        }
                        return [key, argument[key]]
                    }))).catch(error => {
                        this.emit("error", error)
                        if (typeof error == "string") {
                            throw new ServiceException(error)
                        } else {
                            throw new ServiceException(error.message, error)
                        }
                    })
                return result
            }
        }
    }
}

module.exports = Services