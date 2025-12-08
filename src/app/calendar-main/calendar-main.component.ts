import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import  Swal from 'sweetalert2';
declare var $: any;
@Component({
  selector: 'app-calendar-main',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './calendar-main.component.html',
  styleUrl: './calendar-main.component.css'
})
export class CalendarMainComponent implements OnInit {
  title = 'Components / Calendar';
ngOnInit(): void {

      var date = new Date();
      var d = date.getDate();
      var m = date.getMonth();
      var y = date.getFullYear();

      $('#external-events div.external-event').each(function() {
        // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
        // it doesn't need to have a start or end
        var eventObject = {
          title: $.trim($(this).text()) // use the element's text as the event title
        };
        // store the Event Object in the DOM element so we can get to it later
        $(this).data('eventObject', eventObject);
        // make the event draggable using jQuery UI
        $(this).draggable({
          zIndex: 999,
          revert: true,      // will cause the event to go back to its
          revertDuration: 0  //  original position after the drag
        });

      });
      /************** initialize the calendar *********************
      -----------------------------------------------------------------*/
      var calendar =  $('#calendar').fullCalendar({
        header: {
          left: 'title',
          center: 'agendaDay,agendaWeek,month',
          right: 'prev,next today'
        },
        editable: true,
        firstDay: 1, //  1(Monday) this can be changed to 0(Sunday) for the USA system
        selectable: true,
        defaultView: 'month',
        axisFormat: 'h:mm',
        columnFormat: {
                  month: 'ddd',    // Mon
                  week: 'ddd d', // Mon 7
                  day: 'dddd M/d',  // Monday 9/7
                  agendaDay: 'dddd d'
              },
              titleFormat: {
                  month: 'MMMM yyyy', // September 2009
                  week: "MMMM yyyy", // September 2009
                  day: 'MMMM yyyy'  // Tuesday, Sep 8, 2009
              },
        allDaySlot: false,//cambie a true
              selectHelper: true,
              dayClick: function (date, allDay, jsEvent, view) {
                  if (allDay) {
                      // Clicked on the day number
                      calendar.fullCalendar('changeView', 'agendaDay'/* or 'basicDay' */)
                          .fullCalendar('gotoDate', date.getFullYear(), date.getMonth(), date.getDate());
                  }
              },
              select: function (startDate, endDate, allDay) {
                  if (!allDay) {
                      Swal.fire({
                          input: 'text',
                          title: 'Event title:',
                          showCancelButton: true
                      }).then((result) => {
                          Swal.resetValidationMessage();
                          console.log("result: " + result);
                          if (result) {
                              calendar.fullCalendar('renderEvent',
                                  {
                                      title: result,
                                      start: startDate,
                                      end: endDate,
                                      allDay: allDay
                                  },
                                  true // make the event "stick"
                              );
                              Swal.fire({
                                icon: 'success', // Use 'icon' instead of 'type'
                                title: 'Agended!',
                                html: 'Event title: ' + result
                              });

                          } else {
                              Swal.fire({
                                  icon: 'warning',
                                  title: 'Not Agended!',
                                  html: 'Title is empty! '
                              })
                          }
                          calendar.fullCalendar('unselect');

                      });
                  }
        },
        droppable: true, // this allows things to be dropped onto the calendar !!!
        drop: function(date, allDay) { // this function is called when something is dropped

          // retrieve the dropped element's stored Event Object
          var originalEventObject = $(this).data('eventObject');

          // we need to copy it, so that multiple events don't have a reference to the same object
          var copiedEventObject = $.extend({}, originalEventObject);

          // assign it the date that was reported
          copiedEventObject.start = date;
          copiedEventObject.allDay = allDay;

          // render the event on the calendar
          // the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
          $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);

          // is the "remove after drop" checkbox checked?
          if ($('#drop-remove').is(':checked')) {
            // if so, remove the element from the "Draggable Events" list
            $(this).remove();
          }

        },

        events: [
          {
            title: 'All Day Event',
            start: new Date(y, m, 1)
          },
          {
            id: 999,
            title: 'Repeating Event',
            start: new Date(y, m, d-3, 16, 0),
            allDay: false,
            className: 'info'
          },
          {
            id: 999,
            title: 'Repeating Event',
            start: new Date(y, m, d+4, 16, 0),
            allDay: false,
            className: 'info'
          },
          {
            title: 'Meeting',
            start: new Date(y, m, d, 10, 30),
            allDay: false,
            className: 'important'
          },
          {
            title: 'Lunch',
            start: new Date(y, m, d, 12, 0),
            end: new Date(y, m, d, 14, 0),
            allDay: false,
            className: 'important'
          },
          {
            title: 'Birthday Party',
            start: new Date(y, m, d+1, 19, 0),
            end: new Date(y, m, d+1, 22, 30),
            allDay: false,
          },
          {
            title: 'Click for Google',
            start: new Date(y, m, 28),
            end: new Date(y, m, 29),
            url: 'http://google.com/',
            className: 'success'
          }
        ],
      });


  }
}
