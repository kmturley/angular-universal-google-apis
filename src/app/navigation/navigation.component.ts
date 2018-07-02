import { Component, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';

import { AppRoutingService } from '../app-routing.service';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
    private currentLocale: string;
    public items: Array<any>;

    constructor(
        private router: Router,
        public routeService: AppRoutingService
    ) { }

    ngOnInit() {
        this.items = this.routeService.routes;
        const routerConfig = this.router.config;
        routerConfig.pop(); // remove the default angular blank route
        this.items.forEach(route => {
            routerConfig.push(route);
        });
        this.router.events
          .filter(event => event instanceof RoutesRecognized)
          .map((event: RoutesRecognized) => {
              return event.state.root.firstChild.data;
          })
          .subscribe(data => {
              this.currentLocale = data['locale'];
          });
        console.log('routes', routerConfig);
        this.router.resetConfig(routerConfig);
    }

    onChange(locale) {
      this.router.navigate([`/${locale}`], {});
    }

}
