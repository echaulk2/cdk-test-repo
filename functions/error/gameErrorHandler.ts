export class GameError extends Error {
    message: string;

    constructor(message:string) {
        super();
        this.message = `Game error, datastore response: ${message}`;
    }
}