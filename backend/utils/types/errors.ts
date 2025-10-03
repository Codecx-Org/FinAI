class InternalServerError extends Error {
  constructor(message: string){
    super()
    super.name = "InternalServerError"
    super.message = message
  }

}

class NotFoundError extends Error {
  constructor(message: string){
    super()
    super.name = "NotFoundError"
    super.message = message
  }
}

class BadRequestError extends Error {
  constructor(message: string){
    super()
    super.name = "BadRequestError"
    super.message = message
  }
}

export {
  InternalServerError,
  NotFoundError,
  BadRequestError
}
