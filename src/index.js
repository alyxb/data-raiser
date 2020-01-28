import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';

import 'dotenv/config';
import logger from './logging';

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

//Get data from URL
app.post('/scrape', (req, res) => {

  logger.info(req.body);

  return res.status(200).json({
    results: '',
  });
});

app.listen(port, () =>
  console.log(`Data Raiser API service listening on http://localhost:${port}/`),
);