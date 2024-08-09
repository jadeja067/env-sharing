class ApiResponse {
    constructor(statusCode, data, message="success"){
        this.status = statusCode,
        this.data = data,
        this.message = message
        this.success = this.statusCode < 400
    }
}
export default ApiResponse