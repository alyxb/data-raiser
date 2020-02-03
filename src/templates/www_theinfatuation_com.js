import cheerio from 'cheerio';

export default {
  'www_theinfatuation_com': {
    async exec(html, hostname, origin) {
      
      const $ = cheerio.load(html);

      let currentSubSection;
      const places = [];

      //candidate place iterator
      $('.post__section--guide-body h2, .post__section--guide-body .spot-block').each((i, value) => {

        const subSectionRule = new RegExp('<\s*span[^>]*>(.*?)<\s*/\s*span>', 'g');

        const sectionHTML = $(value).html();

        //SUBSECTION 
        if(subSectionRule && sectionHTML.match(subSectionRule) && sectionHTML.match(subSectionRule).length === 1){
          currentSubSection = $(value).text();
        }
        else {
          //PARSE TARGET PLACE

          //LOAD THESE IN TEMPLATE
          //DEFAULTS IN CLASS EXTENSION
          const costFloor = 0;
          const costCeiling = 4;
          const ratingFloor = 0;
          const ratingCeiling = 10;
          const city = 'Los Angeles'; //should parse from URL
          const state = 'California'; //infer from city
          const country = 'United States'; //infer fron state/city

          let image = $('.spot-block__image-wrapper img', value).attr('src');
          if(image){
            image = image.split('?')[0]; //remove query params, clean image src
          }

          const sourceURL = $('.spot-block__title-copy a', value).attr('href');

          const name = $('.spot-block__title-copy a', value).find('h3').text();

          let categories; //there can be multiple categories
          let neighborhoods; //there can be multiple neighborhoods
          const encodedContextSwitch = '&#xA0;in&#xA0;'; //where html block switches context

          let candidateContent = $('.overview-content', value).html();

          if(candidateContent){

            //remove extra spaces around candidate content
            candidateContent = candidateContent.replace(/\s+/g,' ').trim(); 

            //remove encoded commas
            candidateContent = candidateContent.replace(/,&#xA0;/g, '');

            const candidateArray = candidateContent.split(encodedContextSwitch).filter(Boolean);    

            //extract categories from candidates
            if(candidateArray[0]){
              const $categories = cheerio.load(candidateArray[0].toString());
              categories = $categories('a').map((i, value) => {
                return $categories(value).text();
              }).get();
            }
            //extract neighborhoods from candidates
            if(candidateArray[1]){
              const $neighborhoods = cheerio.load(candidateArray[1].toString());
              neighborhoods = $neighborhoods('a').map((i, value) => {
                return $neighborhoods(value).text();
              }).get();
            }
          }

          const cost = $('.address-price-rating', value).attr('data-price');
          const streetAddress = $('.spot-block__address', value).text().replace('$$$$','').trim();
          const rating = $('.spot-block__rating', value).find('.rating').attr('data-rating');
          const description = $('.spot-block__description-section', value).text().trim();

          //make this a schema
          const placeObj = {
            name: name || null,
            images: image ? [image] : [],
            groupSubtitle: currentSubSection,
            sourceURL: sourceURL ? `${origin}${sourceURL}` : null,
            categoryType: 'food',
            categories: categories || null,
            cost: {
              floor: costFloor,
              ceiling: costCeiling,
              value: cost ? parseInt(cost) : null,
            },
            rating: {
              floor: ratingFloor,
              ceiling: ratingCeiling,
              value: rating ? parseFloat(rating) : null,
            },
            description: description || null,
            location: {
              neighborhoods: neighborhoods || null,
              address: {
                street: streetAddress || null,
                city,
                state,
                country,
                zipcode: '',
              },
              coordinates: {
                lat: null,
                lng: null,
              },
            },
          };

          places.push(placeObj);
        }
      });

      return places;
    },
  },
};