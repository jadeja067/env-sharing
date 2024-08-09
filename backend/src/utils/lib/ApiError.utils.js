class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message)
    this.code = statusCode,
    this.message = message,
    this.errors = errors
    if(stack) this.stack = stack
    else this.stack = Error.captureStackTrace(this, this.constructor)
  }
}
 export default ApiError