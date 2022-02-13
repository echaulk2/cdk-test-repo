import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import { PriceData } from "../models/priceData";
import * as cheerio from "cheerio";
let axios = require('axios').default;

export async function getPriceData(game: Game) : Promise<PriceData> {
  if (!game.desiredPrice)
    throw new GameError("No price associated with this game.", 400);
  let url = `https://www.pricecharting.com/search-products?type=prices&q=${game.gameName}`;    
  try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      let gameCondition = parseCondition(game?.desiredCondition);      
      let priceData = {} as PriceData;
      let lowestPrice = game.desiredPrice;
      let priceSum = 0;
      let noPriceCount = 0;
      let formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });

      $('#games_table tbody tr').each( (i: number, el: cheerio.Element) => {
        let price = Number($(el).find(`td.${gameCondition} span`).text().replace(/\s\s+\$/g, '').replace(/\$/g, '')); 
        //Only averages items where there is a price entered
        if (price == 0) {
          noPriceCount++;
          return;
        } else {
          priceSum+=price;
          priceData.averagePrice = formatter.format(priceSum/(i + 1 - noPriceCount));
        }       

        if (price < lowestPrice) {
          lowestPrice = price;
          priceData.lowestPrice = formatter.format(price);
          priceData.url = `${$(el).find('td.title a').attr('href')}`
          priceData.console = $(el).find('td.console').text();
        }
      });
      return priceData;
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