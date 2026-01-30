import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;
@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css',
})
export class CarouselComponent implements AfterViewInit {
  title = 'Carousels';
  $imageSlider;
  ngAfterViewInit(): void {
    var rtlDirection = $('html').attr('dir') === 'rtl';
    // ================================ Default Slider Start ================================
    $('.default-carousel').slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: false,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 600,
      rtl: rtlDirection,
    });

    // Arrow Carousel
    $('.arrow-carousel').slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 600,
      prevArrow:
        '<button type="button" class="slick-prev"><iconify-icon icon="ic:outline-keyboard-arrow-left" class="menu-icon"></iconify-icon></button>',
      nextArrow:
        '<button type="button" class="slick-next"><iconify-icon icon="ic:outline-keyboard-arrow-right" class="menu-icon"></iconify-icon></button>',
      rtl: rtlDirection,
    });

    // pagination carousel
    $('.pagination-carousel').slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 600,
      prevArrow:
        '<button type="button" class="slick-prev"><iconify-icon icon="ic:outline-keyboard-arrow-left" class="menu-icon"></iconify-icon></button>',
      nextArrow:
        '<button type="button" class="slick-next"><iconify-icon icon="ic:outline-keyboard-arrow-right" class="menu-icon"></iconify-icon></button>',
      rtl: rtlDirection,
    });

    // multiple carousel
    $('.multiple-carousel').slick({
      infinite: true,
      slidesToShow: 4,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 600,
      gap: 24,
      prevArrow:
        '<button type="button" class="slick-prev"><iconify-icon icon="ic:outline-keyboard-arrow-left" class="menu-icon"></iconify-icon></button>',
      nextArrow:
        '<button type="button" class="slick-next"><iconify-icon icon="ic:outline-keyboard-arrow-right" class="menu-icon"></iconify-icon></button>',
      rtl: rtlDirection,
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 991,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });

    this.$imageSlider = $('.progress-carousel');
    this.$imageSlider.slick({
      autoplay: true,
      autoplaySpeed: this.sliderTimer,
      speed: 1000,
      arrows: false,
      dots: false,
      adaptiveHeight: true,
      pauseOnFocus: false,
      pauseOnHover: false,
      rtl: rtlDirection,
    });

    this.progressBar();
    this.$imageSlider.on('beforeChange', (e, slick) => {
      this.progressBar();
    });
    this.$imageSlider.on('afterChange', (e, slick, nextSlide) => {
      this.titleAnim();
    });

    this.titleAnim();
  }
  sliderTimer = 5000;
  beforeEnd = 500;
  titleAnim() {
    this.$imageSlider.find('.slick-current').find('h1').addClass('show');
    setTimeout(() => {
      this.$imageSlider.find('.slick-current').find('h1').removeClass('show');
    }, this.sliderTimer - this.beforeEnd);
  }
  progressBar() {
    $('.slider-progress').find('span').removeAttr('style');
    $('.slider-progress').find('span').removeClass('active');
    setTimeout(() => {
      $('.slider-progress')
        .find('span')
        .css('transition-duration', this.sliderTimer / 1000 + 's')
        .addClass('active');
    }, 100);
  }
}
