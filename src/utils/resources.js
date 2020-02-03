//should be in database
export const countryToCurrency = {
  'Germany': {
    symbol: '€',
    code: 'EUR',
    terms: [{
      term: 'euro', 
      precede: false
    },{
      term: 'euros', 
      precede: false
    },{
      term: '€', 
      precede: true
    }],
  },
  'United States': {
    symbol: '$',
    code: 'USD',
    terms: [{
      term: 'dollar', 
      precede: false
    },{
      term: 'dollars', 
      precede: false
    },{
      term: '$', 
      precede: true
    }],
  },
};

//should be in database with other checks to ensure correct city to country lookup 
//due to multiple countries with same city names (likely using 3rd party + geo cache) or map server
export const cityToCountry = {
  'Berlin': 'Germany',
};

export const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];