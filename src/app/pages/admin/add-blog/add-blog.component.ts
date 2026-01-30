import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import Quill from 'quill';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
declare var $: any;
@Component({
  selector: 'app-add-blog',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './add-blog.component.html',
  styleUrl: './add-blog.component.css'
})
export class AddBlogComponent implements AfterViewInit, OnInit {
  title = 'Add Blog';
  constructor() { }
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
  ngAfterViewInit() {
    const fileInput = document.getElementById("upload-file") as HTMLInputElement;
    const imagePreview = document.getElementById("uploaded-img__preview") as HTMLImageElement;
    const uploadedImgContainer = document.querySelector(".uploaded-img");
    const removeButton = document.querySelector(".uploaded-img__remove");

    fileInput.addEventListener("change", (e: any) => {
      if (e.target.files.length) {
        const src = URL.createObjectURL(e.target.files[0]);
        imagePreview.src = src;
        uploadedImgContainer.classList.remove('d-none');
      }
    });
    removeButton.addEventListener("click", () => {
      imagePreview.src = "";
      uploadedImgContainer.classList.add('d-none');
      fileInput.value = "";
    });

  }

}
