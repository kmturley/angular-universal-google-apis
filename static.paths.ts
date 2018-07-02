import { environment } from './src/environments/environment.prod';

const request = require('request');
const routes = [];
const req = request.defaults({
  headers: {
    'Authorization': `Bearer ${environment.TOKEN}`
  }
});

function getField(items: Array <any>, field: string, match: string) {
  let itemNew = '';
  items.filter((item) => {
    if (item[field] === match) {
      itemNew = item['field_values'][0]['value'];
    }
    return true;
  });
  return itemNew;
}

function getLocale(locale) {
  return new Promise((resolve, reject) => {
    req.post(`${environment.API_URL}documents/search?fields=schema&locale=${locale}`, {
      form: {
        'project_id': environment.PROJECT_ID,
        'collection_id': 'Pages',
        'repo_id': environment.REPO_ID
      }
    }, (err, res, data) => {
      if (err) { return reject(err); }
      data = JSON.parse(data);
      resolve(data['document_list']['documents']);
    });
  });
}

function addRoutes(items) {
  items.forEach(route => {
    let path = getField(route['content']['fields'], 'field_name', 'url');
    if (route.locale !== 'en_US') {
      path = '/' + route.locale + path;
    }
    routes.push(path);
  });
}


export function getPaths() {
  return new Promise((resolve, reject) => {
    req.post(environment.API_URL + 'repo', {
      form: {
        'repo_id': environment.REPO_ID
      }
    }, (err, res, data) => {
      if (err) { return reject(err); }
      data = JSON.parse(data);
      if (data['error']) { return reject(data); }
      const locales = data.locales;
      locales.push('en_US');
      console.log('locales', data.locales);
      const promises = [];
      locales.forEach((locale) => {
        promises.push(getLocale(locale));
      });
      Promise.all(promises).then((items) => {
        items.forEach((item) => {
          addRoutes(item);
          resolve(routes);
        });
      });
    });
  });
}
