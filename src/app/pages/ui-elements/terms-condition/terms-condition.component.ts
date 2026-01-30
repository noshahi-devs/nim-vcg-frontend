import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import Quill from 'quill';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-terms-condition',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './terms-condition.component.html',
  styleUrl: './terms-condition.component.css'
})
export class TermsConditionComponent implements OnInit {
  title = 'Terms & Conditions';
  @ViewChild('editor', { static: true }) editorElement: ElementRef;

  ngOnInit() {
    const quill = new Quill(this.editorElement.nativeElement, {
      modules: {
        toolbar: '#toolbar-container'
      },
      placeholder: 'Compose an epic...',
      theme: 'snow'
    });
  }
}
