//converts 12 hour time to 24 hour time
export function convert12hrTo24hr(time12h){

  //standardize, uppercase letters and remove fullstops (i.e: p.m. to PM)
  time12h = time12h.trim().toUpperCase().replace(/\./g,'');

  if(time12h === 'NOON'){
    time12h = "12:00 PM";
  }

  //include :00 when missing
  if(time12h.indexOf(':') < 0){
    const parsed = time12h.split(' ');
    time12h = `${parsed[0]}:00 ${parsed[1]}`;
  }

  //this logic below from: https://stackoverflow.com/a/40197728
  const [time, modifier] = time12h.split(' ');

  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
}

export function normalizeString(string){
  return string.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g,' ').trim();
}

export async function getPointerFromHtml(html, candidateTemplatePointers){
  if(!candidateTemplatePointers || !html){
    throw new Error('Missing candidateTemplatePointers or HTML')
  }

  for (const element of Object.keys(candidateTemplatePointers)) {
    if(html.includes(element)){
      return candidateTemplatePointers[element];
    }
  }

  return null;
}

//generate request headers
export function requestHeaders(language = 'en-US,en'){
  return {
    'User-Agent': userAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language':`${language};q=0.9`,
    'Cache-Control':'max-age=0',
    'Connection':'keep-alive'
  };
}

//returns a random integer between 0 and the specified exclusive maximum
function randomInt(exclusiveMax) {
  return Math.floor(Math.random() * Math.floor(exclusiveMax))
}

//returns a user agent to be used in request headers
function userAgent() {
  const osxVer = Math.floor(Math.random() * 9) + 1;
  const webkitMajVer = randomInt(999) + 111;
  const webkitMinVer = randomInt(99) + 11;
  const chromeMajVer = randomInt(99) + 11;
  const chromeMinVer = randomInt(9999) + 1001;
  const safariMajVer = randomInt(999) + 111;
  return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_'+ osxVer +
  ') AppleWebKit/' + webkitMajVer + '.' + webkitMinVer +
  ' (KHTML, like Gecko) Chrome/' + chromeMajVer + '.0.' + chromeMinVer +
  '2623.110 Safari/' + safariMajVer +'.36';
}

//split string or array at index
//https://stackoverflow.com/a/38757490
export const splitAt = index => x => [x.slice(0, index), x.slice(index)];

