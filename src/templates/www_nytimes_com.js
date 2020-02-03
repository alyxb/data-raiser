import cheerio from 'cheerio';

import { 
  requestHeaders, 
  convert12hrTo24hr, 
  splitAt, 
  normalizeString, 
  getPointerFromHtml 
} from '../utils/generate';
import { 
  countryToCurrency, 
  cityToCountry, 
  daysOfWeek 
} from '../utils/resources';

export default {
  'www_nytimes_com': {
    async exec(html, hostname, origin) {

      //TODO: store in seperate file
      const templatePointers = {
        'www.nytimes.com': {
          "require('mapmaker-map-mapbox'": 'nyt_mapbox',
        },
      };
      
      //domain specific pointers
      const candidateTemplatePointers = templatePointers[hostname];

      const templatePointer = await getPointerFromHtml(html, candidateTemplatePointers);

      //return if no pointer? or is there default
      if(!templatePointer){
        return 'no pointer found for domain';
      }

      //LOAD templatePointer for NYT by type, i.e. "nyt_mapbox",
      //which executes logic below this area

      //should be parsing city from URL / scraped data
      const city = 'Berlin';
      const country = cityToCountry[city];
      const currency = countryToCurrency[country];

      //put these into template pointer
      //template pointer file can return file to load
      const start = `window.nytg_loader_v1.require('mapmaker-map-mapbox', {url: ""}, function(lib) {
  var data =`;
      const end = `;
  lib.create(`;

      const a = html.indexOf(start);
      const b = html.indexOf(end);

      let mapMarkerString = html.substring(a + start.length, b).trim();

      if (!mapMarkerString){
        throw new Error('map marker string not found in html source');
      }

     // console.log(html)

      const mapMarkerJson = JSON.parse(mapMarkerString);

      if (!mapMarkerJson.symbols || !Array.isArray(mapMarkerJson.symbols)){
        throw new Error(`map marker string not parsed correctly to json: ${mapMarkerJson}`);
      }

      const confirmedPlaces = mapMarkerJson.symbols.map(symbol => {
        return symbol.data.reduce((acc, curr) => {
           switch(curr.name){
              case 'popup':

                //extract place name
                acc.name = curr.title;

                //extract place address
                const parser = curr.body.split('\n');

                //remove city from street, clean up dangling commas
                const streetAddress = parser[0].replace(city, '').replace(/,\s*$/, '').trim();
                acc.location.address.street = streetAddress;

                acc.location.address.city = city;
                acc.location.address.country = country;

                //extract place URL
                if(parser[1]){
                  acc.placeURL = parser[1];
                }
                break;

              case 'root':
                //extract place coordinates
                acc.location.coordinates = curr.location;
                break;
           }
           return acc;
        },{
          location: { address: {} },
        });
      });


      const $ = cheerio.load(html);

      const placeValuesToMatch = [];

      //MAKE THESE INTO STRING VARIABLES
      $('div.css-1fanzo5 > div.css-53u6y8').each((i, value) => {

        if(!$('h3', value).text()){
          return;
        }

        //let currentPlace = 0;
        $('h3, p', value).each((i, value) => {

          const text = $(value).text().trim();
          const html = $(value).html();

          //function here
          //match place headline syntax
          const categoryRegex = /^([1-9]?[0-9]\) )/;
          //match temporal instances i.e. "9 p.m.", "10:30 a.m.", "Noon" 
          const nytTemporalRegex = /(?:(?:[01]?[0-9]|2[0-3])(?::[0-5][0-9])? [ap]\.m\.|Noon)/;

          //is place headline
          if(text.match(categoryRegex)){
                    
            //extract time
            let time = text.match(nytTemporalRegex)[0];
            time = convert12hrTo24hr(time);

            placeValuesToMatch.push({
              headline: text.replace(categoryRegex, '').trim(),
              time: {
                type: '24hr',
                format: 'HH:MM',
                value: time,
              },
            });

          }
          else {
            //is description area
            const candidatePlaces = $('a', value).map((i, link) => {
              let placeName = $(link).text();

              //TEMP SWITCH: webpage has inconsistent / shortened namings
              //NEED to implement fuzzy text match score to rank likelihood of matches
              switch(placeName){
                case 'Humana Second Hand & Vintage':
                  placeName = 'Humana Secondhand & Vintage';
                  break;
                case 'Ampelmann':
                  placeName = 'Ampelmann Shop';
                  break;
              }
              
              return placeName;
            }).get();

            const cost = currency.terms.reduce((acc, curr) => {
              if(acc.length > 0){
                return acc;
              }
              //found first match of cost
              //NOTE: this isn't exact due to some descrips with multiple instances of cost
              const costIndex = text.indexOf(curr.term);
              if(text.indexOf(curr.term) > -1){

                const splitText = splitAt(costIndex)(text);
                //cost matcher precedes value, i.e. "€50" -> "50"
                if(curr.precede){
                  //get value after split, remove term
                  const costValue = splitText[1].replace(curr.term,'');
                  //extract cost from beginning of string
                  //needs to parse floats not just ints
                  acc.push(costValue.replace(/(^\d+)(.+$)/i,'$1'));
                }
                else {
                  //cost matcher does not precede value, i.e. "50 euros" -> "50"
                  //get value before split
                  const costValue = splitText[0].trim();
                  //Finds cost from end of string
                  //NOTE: needs to parse floats, not just integers
                  acc.push(costValue.replace(/.*(?:\D|^)(\d+)/i,'$1'));
                }
              }
              return acc;
            },[]);

            //prevent overwriting
            if(placeValuesToMatch[placeValuesToMatch.length - 1].description){
              return;
            }

            placeValuesToMatch[placeValuesToMatch.length - 1] = {
              ...placeValuesToMatch[placeValuesToMatch.length - 1],
              cost: {
                currency: currency.code,
                value: cost ? cost[0] : null,
              },
              description: text, //need to clean html out, etc
              candidatePlaces,
            }
          }
        });
      });

      //first, try to match to confirmed places by candidate place names
      //Note: should be filter to then include non-matched as new places (i.e. Lodging)
      placeValuesToMatch.forEach(placeValue => {

        let matchIndex = [];
        const relevantPlaces = [];

        //try to match place data by candidatePlaces
        if(placeValue.candidatePlaces.length > 0){
          
          matchIndex = placeValue.candidatePlaces.reduce((acc, curr) => {

            const placeIndex = confirmedPlaces.findIndex( ({ name }) => { 
              const confirmedName = normalizeString(name);
              const candidateName = normalizeString(curr);
              return confirmedName === candidateName;
            });

            if(typeof placeIndex === 'number' && placeIndex > -1){
              acc.push(placeIndex);
            }else {
              relevantPlaces.push(curr);
            }
            return acc;
          },[]);
        }

        //placeValue doesn't have candidatePlaces OR could not find index from candidatePlaces
        if(!matchIndex || matchIndex.length < 1){
          //placeValue doesn't include candidate places (via <a href>)
          if(!placeValue.description){
            return;
          }
          const index = confirmedPlaces.findIndex(({ name, description }) => {
            //prevent overwriting confirmed matches made with candidatePlaces[]
            if(description) {
              return false;
            }
            const placeValueDescription = normalizeString(placeValue.description);
            const confirmedName = normalizeString(name);
            //return true if name found in candidate place description
            return placeValueDescription.includes(confirmedName);
          });
          matchIndex.push(index);
        }

        matchIndex.forEach(index => {
          if(typeof index === 'number' && index > -1 && confirmedPlaces[index]){
            confirmedPlaces[index] = {
              ...confirmedPlaces[index],
              ...placeValue,
              relevantPlaces,
            };
            if(confirmedPlaces[index].candidatePlaces){
              //remove non-relevant place data
              delete confirmedPlaces[index].candidatePlaces;
            }
          }
        });
      });
      
      //collect images
      //NOTE: only collects first image /!\
      //--> need a headless browser to collect all images on page (or parse preload JS object)
      $('[data-testid=photoviewer-children]').each((i, value) => {

        let image = $('img',value).attr('src');
        if(image){
          image = image.split('?')[0]; //remove url query params
        }

        if($('img',value).attr('alt')){
          const imageDescription = normalizeString($('img',value).attr('alt'));

          confirmedPlaces.forEach((place, i) => {
            const name = normalizeString(place.name);
            if(imageDescription.includes(name)){
              confirmedPlaces[i] = {
                ...confirmedPlaces[i],
                images: [image],
              }
            }
          });      
        }

      });

      return confirmedPlaces;

    },
  },
};