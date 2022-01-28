export class CollectionError extends Error {
    message: string;
    statusCode: number;

    constructor(message:string, statusCode:number) {
        super();
        this.message = `Collection error, datastore response: ${message}`;
        this.statusCode = statusCode;
    }
}