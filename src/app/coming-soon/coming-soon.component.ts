import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.css'
})
export class ComingSoonComponent implements AfterViewInit {
  title = 'Coming Soon';
  constructor() { }

  ngAfterViewInit() {
    function getTimeRemaining(endtime) {
      var t = Date.parse(endtime) - Date.parse(Date());

      /***** CONVERT THE TIME TO A USEABLE FORMAT *****/
      var seconds = Math.floor((t / 1000) % 60);
      var minutes = Math.floor((t / 1000 / 60) % 60);
      var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
      var days = Math.floor(t / (1000 * 60 * 60 * 24));

      /***** OUTPUT THE CLOCK DATA AS A REUSABLE OBJECT *****/
      return {
        total: t,
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
      };
    }

    /***** DISPLAY THE CLOCK AND STOP IT WHEN IT REACHES ZERO *****/
    function initializeClock(id, endtime) {
      var clock = document.getElementById(id);
      var daysSpan = clock.querySelector(".days");
      var hoursSpan = clock.querySelector(".hours");
      var minutesSpan = clock.querySelector(".minutes");
      var secondsSpan = clock.querySelector(".seconds");

      function updateClock() {
        var t = getTimeRemaining(endtime);

        daysSpan.innerHTML = t.days.toString();
        hoursSpan.innerHTML = ("0" + t.hours).slice(-2);
        minutesSpan.innerHTML = ("0" + t.minutes).slice(-2);
        secondsSpan.innerHTML = ("0" + t.seconds).slice(-2);

        if (t.total <= 0) {
          clearInterval(timeinterval);
        }
      }

      updateClock(); // run function once at first to avoid delay
      var timeinterval = setInterval(updateClock, 1000);
    }

    /***** SET A VALID END DATE *****/
    var deadline = new Date(Date.parse(Date()) + 99 * 24 * 60 * 60 * 1000);
    initializeClock("coming-soon", deadline);

  }

}
