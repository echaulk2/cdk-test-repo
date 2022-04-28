export class UserError extends Error {
    message: string;

    constructor(message:string) {
        super();
        this.message = `User error, datastore response: ${message}`;
    }
}