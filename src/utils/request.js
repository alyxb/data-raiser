import request from 'request';

//Request with promise
export default function requestPromise(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) return reject(err);
      return resolve(body);
    });
  });
}