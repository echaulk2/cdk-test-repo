import { GamePriceMonitor } from "../../models/gamePriceMonitor";
import * as Interfaces from "../interfaces/interfaces";
import * as Config from "../config/config";

export function deserializeGamePriceMonitorData(data: Interfaces.IDynamoGamePriceMonitor) : GamePriceMonitor {
    return new GamePriceMonitor(data.priceMonitorID, data.userID, data?.collectionID, data.gameID, data.desiredCondition, data.desiredPrice);
}

export function serializeNewGamePriceMonitorData(userData: Interfaces.IUserData, data: Interfaces.IJSONGamePriceMonitor) : GamePriceMonitor {
  let priceMonitorID = `PM-${Config.uuidv4()}`;
  return new GamePriceMonitor(priceMonitorID, userData.userID, data.collectionID, data.gameID, data.desiredCondition, data.desiredPrice);
}

export function serializeExistingGamePriceMonitorData(userData: Interfaces.IUserData, data: Interfaces.IJSONGamePriceMonitor) : GamePriceMonitor {
  return new GamePriceMonitor(data.priceMonitorID, userData.userID, data.collectionID, data.gameID, data.desiredCondition, data.desiredPrice);
}