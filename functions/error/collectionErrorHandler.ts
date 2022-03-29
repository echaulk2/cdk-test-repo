export class CollectionError extends Error {
    message: string;

    constructor(message:string) {
        super();
        this.message = `Collection error, datastore response: ${message}`;
    }
}