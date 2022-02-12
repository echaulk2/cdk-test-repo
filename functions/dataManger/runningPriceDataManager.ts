import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import { RunningPriceData } from "../models/runningPriceData";
import * as cheerio from "cheerio";
let axios = require('axios').default;

export async function getLowestPriceData(game: Game) : Promise<RunningPriceData> {
    let url = `https://www.pricecharting.com/search-products?type=prices&q=${game.gameName}`;
    try {
      if (!game.desiredPrice)
        throw new GameError("No price associated with this game.", 400);
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      let gameCondition = parseCondition(game?.desiredCondition);      
      let lowestPriceData = {} as RunningPriceData;
      let lowestRunningPrice = game.desiredPrice;
      let formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });

      $('#games_table tbody tr').each( (i: number, el: cheerio.Element) => {
        let price = Number($(el).find(`td.${gameCondition} span`).text().replace(/\s\s+\$/g, '').replace(/\$/g, '')); 
        if (price == 0)
          return;
          
        if (price < lowestRunningPrice) {
          lowestRunningPrice = price;
          lowestPriceData.lowestRunningPrice = formatter.format(price);
          lowestPriceData.url = `${$(el).find('td.title a').attr('href')}`
          lowestPriceData.console = $(el).find('td.console').text();
        }
      });
      return lowestPriceData;
    } catch (err) {
        throw err;
    }
}

export function parseCondition(condition?: string) {
    let parsedCondition: string;
    switch(condition) {
      case('loose'):
        parsedCondition = 'used_price';
        break;
      case("cib"):
        parsedCondition = 'cib_price';
        break;
      default:
        parsedCondition = 'new_price';
        break;
    }
    return parsedCondition;
}