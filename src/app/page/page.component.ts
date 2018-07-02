import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../environments/environment';
import { ApiService } from '../shared/api.service';

import { Page } from '../shared/api.service';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  public page = new Page({});

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit() {
    this.route.data.subscribe((data) => {
      const id = data.locale + '_' + data.url.slice(1).replace('/', '_');
      this.api.get(`${environment.API_URL}documents/${data.document_id}?collection_id=${data.collection_id}&project_id=${data.project_id}&repo_id=${data.repo_id}&locale=${data.locale}`, id).subscribe(page => {
        console.log('PageComponent', page);
        this.page = page;
        this.title.setTitle(this.page['name']);
        this.meta.updateTag({ name: 'description', content: this.page['name'] });
      });
    });
  }

}
