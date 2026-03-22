import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AppConfigService } from '../../../services/app-config.service';
import { StaffService } from '../../../services/staff.service';
import { NotificationService } from '../../../services/notification.service';
import { MessageService } from '../../../services/message.service';
import { Notification } from '../../../Models/notification';
import { UserMessage } from '../../../Models/user-message';
import { CampusService } from '../../../services/campus.service';
import { Campus } from '../../../Models/campus';
import { StudentService } from '../../../services/student.service';
import { AcademicYear } from '../../../Models/academic-year';
declare const $: any;
import { CommonModule, NgIf } from "@angular/common";

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideNavComponent implements OnInit, AfterViewInit, OnDestroy {

  currentYear = new Date().getFullYear();
  currentThemeSetting: string = 'light';
  roles: string[] = [];
  config: any;
  notifications: Notification[] = [];
  messages: UserMessage[] = [];
  unreadNotificationCount = 0;
  unreadMessageCount = 0;

  campuses: Campus[] = [];
  selectedCampus: Campus | null = null;

  get currentUser() {
    return this.authService.userValue;
  }

  displayName: string = '';
  profileImageUrl: string = 'assets/images/user.png';

  private routerSubscription!: Subscription;
  private readonly eventNamespace = ".sideNav";

  @ViewChild('themeButton') themeButton!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    public authService: AuthService,
    private appConfig: AppConfigService,
    private staffService: StaffService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private campusService: CampusService,
    private studentService: StudentService
  ) { }

  ngOnInit(): void {
    // ✅ Load dynamic config
    this.appConfig.config$.subscribe(config => {
      this.config = config;
    });

    // ✅ Load roles
    this.roles = this.authService.roles;

    // Set fallback display name
    this.displayName = this.currentUser?.fullName || this.currentUser?.username || 'User';

    if (this.hasRole('Student')) {
      const studentId = this.currentUser?.studentId || Number(this.currentUser?.id);
      if (!isNaN(studentId)) {
        this.studentService.GetStudent(studentId).subscribe({
          next: (student) => {
            if (student && student.studentName) {
              this.displayName = student.studentName;
            }
          },
          error: () => { }
        });
      }
    } else if (this.currentUser?.email && !this.currentUser?.fullName) {
      this.staffService.getStaffByEmail(this.currentUser.email).subscribe({
        next: (staff) => {
          if (staff && staff.staffName) {
            this.displayName = staff.staffName;
          }
          if (staff && staff.imagePath) {
            this.profileImageUrl = staff.imagePath;
          }
        },
        error: () => { }
      });
    } else if (this.currentUser?.email) {
      this.staffService.getStaffByEmail(this.currentUser.email).subscribe({
        next: (staff) => {
          if (staff && staff.imagePath) {
            this.profileImageUrl = staff.imagePath;
          }
        },
        error: () => { }
      });
    }

    // ✅ Theme setup
    this.themeService.applySavedTheme();
    this.currentThemeSetting = this.themeService.getSavedTheme();

    setTimeout(() => {
      if (this.themeButton) {
        this.themeService.updateButton(
          this.themeButton.nativeElement,
          this.currentThemeSetting === 'dark'
        );
      }
    });

    // ✅ Router active class
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.handleSidebarActiveClass(event);
      }
    });

    // ✅ Load Notifications & Messages
    this.loadNotifications();
    this.loadMessages();

    // ✅ Load Campuses
    this.loadCampuses();
  }

  loadCampuses() {
    this.campusService.getCampuses().subscribe({
      next: (data) => {
        this.campuses = data;
        this.selectedCampus = this.campusService.getSelectedCampus();

        // If no campus selected, default to the first one available
        if (!this.selectedCampus && data.length > 0) {
          this.onCampusChange(data[0]);
        }
      },
      error: (err) => console.error('Error loading campuses', err)
    });
  }

  onCampusChange(campus: Campus) {
    this.selectedCampus = campus;
    this.campusService.setSelectedCampus(campus);
    // Reload data or refresh page if needed
    // window.location.reload(); 
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadNotificationCount = data.filter(n => !n.isRead).length;
      },
      error: (err) => console.error('Error loading notifications', err)
    });
  }

  loadMessages() {
    this.messageService.getInbox().subscribe({
      next: (data) => {
        this.messages = data;
        this.unreadMessageCount = data.filter(m => !m.isRead).length;
      },
      error: (err) => console.error('Error loading messages', err)
    });
  }

  markNotificationAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.loadNotifications();
    });
  }

  markMessageAsRead(id: number) {
    this.messageService.markAsRead(id).subscribe(() => {
      this.loadMessages();
    });
  }
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles);
  }


  ngAfterViewInit(): void {
    const ns = this.eventNamespace;

    $(".sidebar-menu .sidebar-submenu li")
      .off(`click${ns}`)
      .on(`click${ns}`, (event) => {
        event.stopPropagation();
      });

    $(".sidebar-menu .dropdown")
      .off(`click${ns}`)
      .on(`click${ns}`, function (event) {
        event.preventDefault();
        const item = $(this);

        // Close ALL other dropdowns except the clicked one
        $(".sidebar-menu .dropdown").not(item).each(function () {
          const otherItem = $(this);
          if (otherItem.hasClass("dropdown-open") || otherItem.hasClass("open")) {
            otherItem.children(".sidebar-submenu").slideUp(280);
            otherItem.removeClass("dropdown-open open");
          }
        });

        // Toggle the clicked one
        item.children(".sidebar-submenu").slideToggle(280);
        item.toggleClass("dropdown-open open");
      });

    // Shared hover timer prevents flicker when toggle button moves during expansion
    let sidebarHoverTimer: ReturnType<typeof setTimeout> | null = null;

    const onSidebarHoverIn = () => {
      if (sidebarHoverTimer) {
        clearTimeout(sidebarHoverTimer);
        sidebarHoverTimer = null;
      }
      if ($(".sidebar").hasClass("active")) {
        $(".sidebar").addClass("sidebar-hover-expand");
      }
    };

    const onSidebarHoverOut = () => {
      // Longer grace period (350ms) to cross the gap between toggle button and sidebar body
      sidebarHoverTimer = setTimeout(() => {
        $(".sidebar").removeClass("sidebar-hover-expand");
        sidebarHoverTimer = null;
      }, 350);
    };

    // Attach to both the sidebar body and the toggle button so hovering either keeps it expanded
    $(".sidebar")
      .off(`mouseenter${ns} mouseleave${ns}`)
      .on(`mouseenter${ns}`, onSidebarHoverIn)
      .on(`mouseleave${ns}`, onSidebarHoverOut);

    $(".sidebar-toggle")
      .off(`click${ns} mouseenter${ns} mouseleave${ns}`)
      .on(`click${ns}`, (event) => {
        const btn = $(event.currentTarget);
        const sidebar = $(".sidebar");
        const dashMain = $(".dashboard-main");

        // Clear any pending hover-collapse timer
        if (sidebarHoverTimer) {
          clearTimeout(sidebarHoverTimer);
          sidebarHoverTimer = null;
        }
        sidebar.removeClass("sidebar-hover-expand");

        const isCollapsed = sidebar.hasClass("active"); // active = collapsed (icon-only)

        if (isCollapsed) {
          // Arrow was visible — user clicked to EXPAND
          sidebar.removeClass("active");
          dashMain.removeClass("active");
          btn.removeClass("active");
        } else {
          // Hamburger was visible — user clicked to COLLAPSE
          sidebar.addClass("active");
          dashMain.addClass("active");
          btn.addClass("active");
        }
      })
      .on(`mouseenter${ns}`, onSidebarHoverIn)
      .on(`mouseleave${ns}`, onSidebarHoverOut);

    $(".sidebar-mobile-toggle")
      .off(`click${ns}`)
      .on(`click${ns}`, () => {
        $(".sidebar").addClass("sidebar-open");
        $("body").addClass("overlay-active");
      });

    $(".sidebar-close-btn")
      .off(`click${ns}`)
      .on(`click${ns}`, () => {
        this.closeMobileSidebar();
      });

    $(document)
      .off(`click${ns}`)
      .on(`click${ns}`, (event) => {
        if (!$("body").hasClass("overlay-active")) {
          return;
        }

        const eventTarget = event.target;
        if (!(eventTarget instanceof Element)) {
          return;
        }

        const target = $(eventTarget);
        if (!target.closest(".sidebar, .sidebar-mobile-toggle").length) {
          this.closeMobileSidebar();
        }
      });

    $(window)
      .off(`resize${ns}`)
      .on(`resize${ns}`, () => {
        if (window.innerWidth >= 1200) {
          this.closeMobileSidebar();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    const ns = this.eventNamespace;
    $(".sidebar-menu .sidebar-submenu li").off(ns);
    $(".sidebar-menu .dropdown").off(ns);
    $(".sidebar-toggle").off(ns);
    $(".sidebar-mobile-toggle").off(ns);
    $(".sidebar-close-btn").off(ns);
    $(document).off(ns);
    $(window).off(ns);
  }

  handleSidebarActiveClass(event: NavigationEnd) {
    if (typeof window === 'undefined') return;

    // Clear existing active states
    $(".sidebar-menu a").removeClass("active-page");
    $(".sidebar-menu .dropdown").removeClass("dropdown-open open");
    $(".sidebar-menu .sidebar-submenu").slideUp(0);

    const currentPath = window.location.pathname;

    // Find the link matching the current path
    const activeLink = $(".sidebar-menu a").filter(function () {
      const routerLink = $(this).attr("routerlink");
      return routerLink === currentPath;
    });

    if (activeLink.length > 0) {
      activeLink.addClass("active-page");

      // If it's inside a dropdown, open the parent
      const parentDropdown = activeLink.closest(".dropdown");
      if (parentDropdown.length > 0) {
        parentDropdown.addClass("dropdown-open open");
        parentDropdown.children(".sidebar-submenu").slideDown(0);
      }
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.closeMobileSidebar();
  }

  toggleTheme(): void {
    const newTheme = this.currentThemeSetting === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(newTheme);

    if (this.themeButton) {
      this.themeService.updateButton(
        this.themeButton.nativeElement,
        newTheme === 'dark'
      );
    }

    this.currentThemeSetting = newTheme;
  }

  logout(): void {
    this.authService.logout();
  }

  private closeMobileSidebar(): void {
    $(".sidebar").removeClass("sidebar-open");
    $("body").removeClass("overlay-active");
  }
}

