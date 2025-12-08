import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import $ from 'jquery';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideNavComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'SideNav';
  currentYear: number = new Date().getFullYear();
  private routerSubscription!: Subscription;
  @ViewChild('themeButton') themeButton!: ElementRef<HTMLElement>;

  currentThemeSetting: string = 'light';

  constructor(private router: Router, 
    private themeService: ThemeService
  ) { }
  ngOnInit(): void {

    const localStorageTheme = localStorage.getItem('theme');
    this.currentThemeSetting = this.themeService.calculateSettingAsThemeString(localStorageTheme);

    setTimeout(() => {
      if (this.themeButton) {
        this.themeService.updateButton(this.themeButton.nativeElement, this.currentThemeSetting === 'dark');
      }
    });
    

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.handleSidebarActiveClass(event);  // Call your function after route change
      }
    });
  }
  ngOnDestroy() {
    // Unsubscribe to avoid memory leaks
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  ngAfterViewInit(): void {
    $(".sidebar-menu .sidebar-submenu li").on("click", (event) => {
      event.stopPropagation()
      
    }); 
    
    $(".sidebar-menu .dropdown").on("click", (event) => {
      const item = $(event.currentTarget); // Use `event.currentTarget` to reference the clicked element
      item.siblings(".dropdown").children(".sidebar-submenu").slideUp();
      item.siblings(".dropdown").removeClass("dropdown-open");
      item.siblings(".dropdown").removeClass("open");
      item.children(".sidebar-submenu").slideToggle();
      item.toggleClass("dropdown-open");
    });

    $(".sidebar-toggle").on("click", (event) => {
      const target = $(event.currentTarget);
      target.toggleClass("active");
      $(".sidebar").toggleClass("active");
      $(".dashboard-main").toggleClass("active");
    });

    $(".sidebar-mobile-toggle").on("click", function () {
      $(".sidebar").addClass("sidebar-open");
      $("body").addClass("overlay-active");
    });

    $(".sidebar-close-btn").on("click", function () {
      $(".sidebar").removeClass("sidebar-open");
      $("body").removeClass("overlay-active");
    });

    $('#selectAll').on('change', function () {
      $('.form-check .form-check-input').prop('checked', $(this).prop('checked'));
    });

    // Remove Table Tr when click on remove btn start
    $('.remove-btn').on('click', function () {
      $(this).closest('tr').remove();

      // Check if the table has no rows left
      if ($('.table tbody tr').length === 0) {
        $('.table').addClass('bg-danger');

        // Show notification
        $('.no-items-found').show();
      }
    });
  }

  handleSidebarActiveClass( event : NavigationEnd) {
    $('html, body').scrollTop(0)
    
    $("ul#sidebar-menu a.active-page").each((x, el) => {
      const $el = $(el);
      $el.removeClass("active-page").removeClass("open");
      $el.parent().removeClass("active-page").removeClass("open");
    });
    for (
      var nk = window.location,
      o = $("ul#sidebar-menu a").filter(function () {
        const anchorElement = this as HTMLAnchorElement;
        const routerLink = anchorElement.getAttribute("routerlink");
        return routerLink === nk.pathname;
      })
        .addClass("active-page") // anchor
        .parent()
        .addClass("active-page");
      ;

    ) { 
      
      if (!o.is("li")) break;
      
        
      o = o.parent().addClass("show").parent().addClass("open");
    }
    $("li.active-page").siblings(".dropdown-open").each((x, el) => {
      $(el).removeClass("open dropdown-open");
      $(el).children(".sidebar-submenu").slideUp();
    })
  }

  toggleTheme(): void {
    const newTheme = this.currentThemeSetting === 'dark' ? 'light' : 'dark';

    // Save the new theme to localStorage
    localStorage.setItem('theme', newTheme);

    // Update button and theme
    if (this.themeButton) {
      this.themeService.updateButton(this.themeButton.nativeElement, newTheme === 'dark');
      this.themeService.updateThemeOnHtmlEl(newTheme);
    }

    // Update the current theme setting
    this.currentThemeSetting = newTheme;
  }
  
}






