import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;
@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css'
})
export class ProgressComponent implements AfterViewInit {
  title = 'Progress';
  constructor() { }

  ngAfterViewInit() {
    $(".progress-wrapper").each(function(){
      var percentage = $(this).attr("data-perc");
      var floatingLabel = $(this).find(".floating-label");

      // Set CSS variable to be used in keyframes
      floatingLabel.css("--left-percentage", percentage);
      
      // Trigger reflow to restart animation
      floatingLabel[0].offsetWidth; // Force reflow
      floatingLabel.css("animation-name", "none");
      floatingLabel.css("left", percentage); // Ensure final position is correct
      floatingLabel.css("animation-name", "animateFloatingLabel");
  });



  // Semi Circle progress bar
  $(".progressBar").each(function(){
      var $bar = $(this).find(".circleBar");
      var $val = $(this).find(".barNumber");
      var perc = parseInt( $val.text(), 10);

      $({p:0}).animate({p:perc}, {
          duration: 3000,
          easing: "swing",
          step: function(p) {
          $bar.css({
              transform: "rotate("+ (45+(p*1.8)) +"deg)", // 100%=180° so: ° = % * 1.8
              // 45 is to add the needed rotation to have the green borders at the bottom
          });
          $val.text(p|0);
          }
      });
  });

}
}
