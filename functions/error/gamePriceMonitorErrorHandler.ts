export class GamePriceMonitorError extends Error {
    message: string;

    constructor(message:string) {
        super();
        this.message = `Game price monitor error: ${message}`;
    }
}