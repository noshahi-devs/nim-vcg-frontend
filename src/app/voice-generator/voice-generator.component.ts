import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;
@Component({
  selector: 'app-voice-generator',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './voice-generator.component.html',
  styleUrl: './voice-generator.component.css'
})
export class VoiceGeneratorComponent implements AfterViewInit {
  title = 'Voice Generator';
  constructor() { }

  ngAfterViewInit() {
    $('audio').audioPlayer();

}
}
