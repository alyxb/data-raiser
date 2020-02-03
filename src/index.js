import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import validator from 'validator';

import 'dotenv/config';
import logger from './utils/logging';
import { scrapePlacesFromURL } from './scraper';

const port = process.env.PORT || 8080;

//Initialize express server
const app = express();
//Some middleware security/compression
app.use(helmet());
app.use(compression());

//Parses text as JSON and exposes resulting object on req.body
app.use(bodyParser.json());

//Health checker
app.get('/health', (req, res) => {
  res.sendStatus(200);
});

//Get places JSON from URL
app.post('/scrape-places', async (req, res) => {
  try {
    const { url } = req.body;

    //check if valid URL
    if (!url || !validator.isURL(url)) {
      return res
        .status(400)
        .json({ error: 'Please include a valid URL to scrape' });
    }

    const scrapedPlaces = await scrapePlacesFromURL(url);

    if(!scrapedPlaces){
      return res
        .status(404)
        .json({ error: `No places found in URL ${url}` });
    }

    return res
      .status(200)
      .json({
        count: scrapedPlaces.length,
        result: scrapedPlaces 
      });

  } catch (err) {
    logger.error({ err });
    return res
      .status(500)
      .json({ error: 'There was an error, please try again.' });
  }
});

app.listen(port, () =>
  console.log(`Data Raiser API service listening on http://localhost:${port}/`),
);