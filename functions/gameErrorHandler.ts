export class GameError extends Error {
    message: string;
    statusCode: number;

    constructor(message:string, statusCode:number) {
        super();
        this.message = `Game error, datastore response: ${message}`;
        this.statusCode = statusCode;
    }
}