# data-raiser
「起し金 資料」

Setup:

`npm install`

then:

`npm start`

This should initialize the API server running on port `8080` by default.

*Note:* You can change this port by modifiying your local .env file, i.e.:

`PORT=9000`

Once server is started, test the scraper with a POST request to

`http://localhost:8080/scrape-places`

with the JSON body of:

```
{
  "url":"https://www.nytimes.com/2019/10/31/travel/what-to-do-36-Hours-in-Berlin.html"
}
```

or 

```
{
  "url":"https://www.theinfatuation.com/los-angeles/guides/restaurants-for-last-meal-in-la"
}
```