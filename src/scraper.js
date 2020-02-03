import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import logger from './utils/logging';
import requestPromise from './utils/request';
import { requestHeaders, convert12hrTo24hr, splitAt, normalizeString } from './utils/generate';
import { countryToCurrency, cityToCountry, daysOfWeek } from './utils/resources';

const templatesDir = path.join(__dirname, '/templates');
let templates = {};

export async function scrapePlacesFromURL(url){

  //REDIS:
  //check if URL in redis (with expiration), if so return redis cache

  const html = await getHTML(url);

  if(!html){
    //should re-try here
    throw new Error('Html not found');
  }

  const places = await parseHTML(html, url);

  //NOTE: with more time:
  //would run validation of place schema against place objects and try to fill in missing/invalid place data with additional parse templates

  //REDIS:
  //store in redis with expiration

  return places;
}

async function parseHTML(html, url){

  //get hostname and origin from url
  const { hostname, origin } = new URL(url);
  //convert hostname to file path
  const fsHostname = hostname.replace(/\./g,'_');
    
  if(!templates[fsHostname]){
    throw new Error(`Scrape template not found for ${hostname}`);
  }

  const places = await templates[fsHostname].exec(html, hostname, origin);

  return places;
}

//get HTML from URL
async function getHTML(url){
  if(!url){
    throw new Error('URL is missing');
  }
  logger.info(`Starting scrape of ${url}`);

  /* Headless browser to get lazy load content */
  /* Note: should be using to get all images from NYT times page (fully loaded html not returning atm) */
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.goto(url, {waitUntil: 'load', timeout: 0});
  // const renderedContent = await page.evaluate(() => new XMLSerializer().serializeToString(document));
  // await browser.close();
  // return renderedContent;

  const options = {
    method: 'GET',
    url,
    headers: requestHeaders(),
    encoding: 'utf8', //some sites will require other encodings, so should load headers/encoding from host template
  };

  return await requestPromise(options);
}

//load scrape templates from /templates dir
try {
  fs
    .readdirSync(templatesDir)
    .filter(file => path.extname(file).toLowerCase() === '.js')
    .map(script => path.join(templatesDir, script))
    .map(require)
    .map(template => {
      const defaultTemplate = template[Object.keys(template)];
      Object.keys(defaultTemplate).forEach(key => {
        templates[key] = defaultTemplate[key];
      });
    });
} catch (err) {
  logger.error({ err });
}