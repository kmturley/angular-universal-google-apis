import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { first, tap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

export class Page {
  date: string;
  modules: object;
  name: string;
  url: string;

  constructor(data: {
    date?: string,
    modules?: object,
    name?: string,
    url?: string
  }) {
    if (data.date) { this.date = data.date; }
    if (data.modules) { this.modules = data.modules; }
    if (data.name) { this.name = data.name; }
    if (data.url) { this.url = data.url; }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState
  ) { }

  get(url, id): Observable<any> {
    const key = makeStateKey(id);
    if (this.transferState.hasKey(key)) {
      const item = this.transferState.get(key, null);
      return of(item);
    } else {
      if (environment.production && isPlatformBrowser(this.platformId)) {
        url = `./json/${id}.json`;
      }
      // console.log('get', url);
      return this.http.get(url).pipe(
        map(items => {
          if (environment.production && isPlatformBrowser(this.platformId)) {
            this.transferState.set(key, items);
            return items;
          } else {
            if (items['document_id']) {
              // TODO find a cleaner Google API, with fewer nested fields
              const modules = [];
              const modulesData = this.getField(items, 'modules');
              if (modulesData) {
                modulesData.forEach((moduleData) => {
                  const imageData = this.getField(moduleData, 'image');
                  let image;
                  if (imageData) {
                    image = {
                      file_path: this.getField(imageData[0], 'file_path'),
                      height: this.getField(imageData[0], 'height'),
                      url: this.getField(imageData[0], 'url'),
                      width: this.getField(imageData[0], 'width')
                    };
                  }
                  modules.push({
                    image: image,
                    quote: this.getField(moduleData, 'quote'),
                    text: this.getField(moduleData, 'text'),
                    video: this.getField(moduleData, 'video')
                  });
                });
              }
              items = new Page({
                date: this.getField(items, 'date'),
                modules: modules,
                name: this.getField(items, 'name'),
                url: this.getField(items, 'url')
              });
            } else {
              Object.keys(items).forEach(item => {
                items[item] = new Page(items[item]);
              });
            }
            this.transferState.set(key, items);
            return items;
          }
        })
      );
    }
  }

  post(url, data, id): Observable<any> {
    const key = makeStateKey(id);
    if (this.transferState.hasKey(key)) {
      const item = this.transferState.get(key, null);
      return of(item);
    } else {
      if (environment.production && isPlatformBrowser(this.platformId)) {
        url = `./json/${id}.json`;
        return this.http.get(url, data).pipe(
          map(items => {
            this.transferState.set(key, items);
            return items;
          })
        );
      } else {
        // console.log('post', url);
        return this.http.post(url, data).pipe(
          map(items => {
            this.transferState.set(key, items);
            return items;
          })
        );
      }
    }
  }

  getField(item: Object, name: string): any {
    let itemNew = '';
    if (item) {
      if (item['content']) {
        item = item['content'];
      }
      item['fields'].filter(function (field) {
        if (field['field_name'] === name) {
          if (field['field_values']) {
            itemNew = field['field_values'][0]['value'];
          } else if ('nested_field_values') {
            itemNew = field['nested_field_values'];
          }
        }
        return true;
      });
    }
    return itemNew;
  }

}
