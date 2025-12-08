import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;
@Component({
  selector: 'app-video-generator',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './video-generator.component.html',
  styleUrl: './video-generator.component.css'
})
export class VideoGeneratorComponent implements AfterViewInit {
  title = 'Image Generator';
  ngAfterViewInit(): void {
    $('.fileUpload').fileUpload();
    $("#imageUpload").change(function() {
      this.readURL(this);
  });
  }


   readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#imagePreview').css('background-image', 'url('+e.target.result +')');
            $('#imagePreview').hide();
            $('#imagePreview').fadeIn(650);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

}
