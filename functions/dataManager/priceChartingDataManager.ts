import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import { GamePriceError } from "../error/gamePriceErrorHandler";
import { GamePriceData } from "../models/gamePriceData";
import * as cheerio from "cheerio";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/gamePriceData";
import * as Interfaces from "../shared/interfaces/interfaces";
import { GamePriceMonitor } from "../models/gamePriceMonitor";

export class PriceCharting implements Interfaces.IPriceProviders {
  getPriceData: (game: Game, gamePriceMonitor: GamePriceMonitor) => Promise<GamePriceData>;

  constructor() {
    this.getPriceData = async function (game: Game, gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceData> {
      let url = `${Config.priceDataURL}${game.gameName}`;
      try {
          const response = await Config.axios.get(url);
          const $ = cheerio.load(response.data);
    
          let priceData = {} as GamePriceData;
          let gameCondition = Common.setDesiredCondition(gamePriceMonitor.desiredCondition);
          let lowestPrice = gamePriceMonitor.desiredPrice;
          let priceSum = 0;
          let noPriceCount = 0;
          let formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          let desiredPriceExists = false;
          priceData.desiredPriceExists = desiredPriceExists;
          $('#games_table tbody tr').each( (i: number, el: cheerio.Element) => {
            let listedPrice = Number($(el).find(`td.${gameCondition} span`).text().replace(/\s\s+\$/g, '').replace(/\$/g, ''));
            let listedConsole = $(el).find('td.console').text().replace(/\s\s+/g, '');
            let listedItemTitle = $(el).find('td.title a').text().replace(/\s\s+/g, '');
            let listedItemURL = $(el).find('td.title a').attr('href');
            //Only averages items where there is a price entered
            if (Common.invalidData(game, listedPrice, listedConsole)) {
              noPriceCount++;
              return;
            } else {
              priceSum+=listedPrice;
              priceData.averagePrice = formatter.format(priceSum/(i + 1 - noPriceCount));
            }       
    
            if (listedPrice < lowestPrice) {
              lowestPrice = listedPrice;
              priceData.lowestPrice = formatter.format(listedPrice);
              priceData.desiredPriceExists = true;
              priceData.listedItemURL = listedItemURL;
              priceData.listedItemConsole = listedConsole;
              priceData.listedItemTitle = listedItemTitle;
            }
          });
          priceData.coverImageURL = priceData.listedItemURL && await Common.getCoverImage(priceData.listedItemURL);
          priceData.lastChecked = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
          priceData.gamePriceDataID = `PD-${Date.parse(priceData.lastChecked).toString()}`;          
          return priceData;
        } catch (err) {
            throw new GamePriceError("Error gathering PriceCharting game price data");
        }
    }     
  }
}