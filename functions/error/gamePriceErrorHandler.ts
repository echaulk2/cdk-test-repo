export class GamePriceError extends Error {
    message: string;
    statusCode: number;

    constructor(message:string, statusCode:number) {
        super();
        this.message = `Game price error: ${message}`;
        this.statusCode = statusCode;
    }
}