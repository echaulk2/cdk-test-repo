export class GamePriceError extends Error {
    message: string;

    constructor(message:string) {
        super();
        this.message = `Game price error: ${message}`;
    }
}