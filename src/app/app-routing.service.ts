import { Inject, Injectable, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Routes } from '@angular/router';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { environment } from '../environments/environment';
import { ApiService } from './shared/api.service';

@Injectable()
export class AppRoutingService {
  public routes: Routes = [];
  public locales = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(LOCALE_ID) private locale: string,
    private api: ApiService,
    private http: HttpClient
  ) {
    this.locale = locale.replace('-', '_');
  }

  getRoutes() {
    return new Promise((resolve, reject) => {
      if (environment.production && isPlatformBrowser(this.platformId)) {
        this.getLocales(resolve);
      } else {
        this.loadGapi().subscribe((a) => {
          this.loadGapiAuth().subscribe((user: Object) => {
            console.log('user', user, this.locale);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('token', user['getAuthResponse']().access_token);
            }
            this.getLocales(resolve);
          });
        });
      }
    });
  }

  getLocales(resolve) {
    return this.api.post(`${environment.API_URL}repo`, {
      'repo_id': environment.REPO_ID
    }, 'locales').subscribe(data => {
      this.locales = data['locales'];
      console.log('locales', this.locales);
      const promises = [];
      this.locales.forEach((locale) => {
        promises.push(this.getLocale(locale));
      });
      Promise.all(promises).then((items) => {
        items.forEach((item) => {
          this.addRoutes(item);
          resolve(this.routes);
        });
      });
    });
  }

  private loadGapi(): Observable<void> {
    return Observable.create((observer: Observer<boolean>) => {
      if (isPlatformBrowser(this.platformId)) {
        const node = document.createElement('script');
        node.src = 'https://apis.google.com/js/api.js';
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        document.getElementsByTagName('head')[0].appendChild(node);
        node.onload = () => {
          observer.next(true);
          observer.complete();
        };
      } else {
        observer.next(true);
        observer.complete();
      }
    });
  }

  private loadGapiAuth(): Observable<Object> {
    return Observable.create((observer: Observer<Object>) => {
      if (isPlatformBrowser(this.platformId)) {
        window['gapi'].load('auth2', () => {
          const auth2 = window['gapi'].auth2.init({
            client_id: environment.CLIENT_ID,
            scope: environment.SCOPE
          });
          auth2.currentUser.listen((user: Object) => {
            observer.next(user);
            observer.complete();
          });
          if (auth2.isSignedIn.get() === true) {
            auth2.signIn();
          }
        });
      } else {
        observer.next({name: 'test'});
        observer.complete();
      }
    });
  }

  getLocale(locale) {
    return new Promise((resolve, reject) => {
      return this.api.post(`${environment.API_URL}documents/search?fields=schema&locale=${locale}`, {
        'project_id': environment.PROJECT_ID,
        'collection_id': 'Pages',
        'repo_id': environment.REPO_ID
      }, locale).subscribe(data => {
        resolve(data['document_list']['documents']);
      });
    });
  }

  getField(items: Array <any>, field: string, match: string) {
    let itemNew = '';
    items.filter((item) => {
      if (item[field] === match) {
        itemNew = item['field_values'][0]['value'];
      }
      return true;
    });
    return itemNew;
  }

  get(item: Object, name: string) {
    let itemNew = '';
    if (item) {
      if (item['content']) {
        item = item['content'];
      }
      item['fields'].filter(function (item) {
        if (item['field_name'] === name) {
          if (item['field_values']) {
            itemNew = item['field_values'][0]['value'];
          } else if ('nested_field_values') {
            itemNew = item['nested_field_values'];
          }
        }
        return true;
      });
    }
    return itemNew;
  }

  addRoutes(items) {
    items.forEach(route => {
      let path = this.getField(route['content']['fields'], 'field_name', 'url');
      const type = route.collection_id.toLowerCase().replace(/s+$/, '');
      if (route.locale !== 'en_US') {
        path = route.locale + path;
      }
      if (path.charAt(0) === '/') {
        path = path.slice(1);
      }
      if (path.charAt(path.length - 1) === '/') {
        path = path.slice(0, -1);
      }
      this.routes.push({
        pathMatch: 'full',
        path: path,
        loadChildren: './' + type + '/' + type + '.module#' + type.charAt(0).toUpperCase() + type.slice(1) + 'Module',
        data: {
          collection_id: route.collection_id,
          document_id: route.document_id,
          locale: route.locale,
          name: this.get(route.content, 'name'),
          project_id: route.project_id,
          repo_id: route.repo_id,
          url: this.get(route.content, 'url')
        }
      });
    });
  }
}
