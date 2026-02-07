import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;
@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.css'
})
export class WizardComponent implements AfterViewInit {
  title = 'Wizard';
  constructor() { }

  ngAfterViewInit() {
            // click on next button
            $('.form-wizard-next-btn').on("click", function() {
                var parentFieldset = $(this).parents('.wizard-fieldset');
                var currentActiveStep = $(this).parents('.form-wizard').find('.form-wizard-list .active');
                var next = $(this);
                var nextWizardStep = true;
                parentFieldset.find('.wizard-required').each(function(){
                    var thisValue = $(this).val();

                    if( thisValue == "") {
                        $(this).siblings(".wizard-form-error").show();
                        nextWizardStep = false;
                    }
                    else {
                        $(this).siblings(".wizard-form-error").hide();
                    }
                });
                if( nextWizardStep) {
                    next.parents('.wizard-fieldset').removeClass("show","400");
                    currentActiveStep.removeClass('active').addClass('activated').next().addClass('active',"400");
                    next.parents('.wizard-fieldset').next('.wizard-fieldset').addClass("show","400");
                    $(document).find('.wizard-fieldset').each(function(){
                        if($(this).hasClass('show')){
                            var formAtrr = $(this).attr('data-tab-content');
                            $(document).find('.form-wizard-list .form-wizard-step-item').each(function(){
                                if($(this).attr('data-attr') == formAtrr){
                                    $(this).addClass('active');
                                    var innerWidth = $(this).innerWidth();
                                    var position = $(this).position();
                                    $(document).find('.form-wizard-step-move').css({"left": position.left, "width": innerWidth});
                                }else{
                                    $(this).removeClass('active');
                                }
                            });
                        }
                    });
                }
            });
            //click on previous button
            $('.form-wizard-previous-btn').on("click",function() {
                var counter = parseInt($(".wizard-counter").text());;
                var prev =$(this);
                var currentActiveStep = $(this).parents('.form-wizard').find('.form-wizard-list .active');
                prev.parents('.wizard-fieldset').removeClass("show","400");
                prev.parents('.wizard-fieldset').prev('.wizard-fieldset').addClass("show","400");
                currentActiveStep.removeClass('active').prev().removeClass('activated').addClass('active',"400");
                $(document).find('.wizard-fieldset').each(function(){
                    if($(this).hasClass('show')){
                        var formAtrr = $(this).attr('data-tab-content');
                        $(document).find('.form-wizard-list .form-wizard-step-item').each(function(){
                            if($(this).attr('data-attr') == formAtrr){
                                $(this).addClass('active');
                                var innerWidth = $(this).innerWidth();
                                var position = $(this).position();
                                $(document).find('.form-wizard-step-move').css({"left": position.left, "width": innerWidth});
                            }else{
                                $(this).removeClass('active');
                            }
                        });
                    }
                });
            });
            //click on form submit button
            $(document).on("click",".form-wizard .form-wizard-submit" , function(){
                var parentFieldset = $(this).parents('.wizard-fieldset');
                var currentActiveStep = $(this).parents('.form-wizard').find('.form-wizard-list .active');
                parentFieldset.find('.wizard-required').each(function() {
                    var thisValue = $(this).val();
                    if( thisValue == "" ) {
                        $(this).siblings(".wizard-form-error").show();
                    }
                    else {
                        $(this).siblings(".wizard-form-error").hide();
                    }
                });
            });
            // focus on input field check empty or not
            $(".form-control").on('focus', function(){
                var tmpThis = $(this).val();
                if(tmpThis == '' ) {
                    $(this).parent().addClass("focus-input");
                }
                else if(tmpThis !='' ){
                    $(this).parent().addClass("focus-input");
                }
            }).on('blur', function(){
                var tmpThis = $(this).val();
                if(tmpThis == '' ) {
                    $(this).parent().removeClass("focus-input");
                    $(this).siblings(".wizard-form-error").show();
                }
                else if(tmpThis !='' ){
                    $(this).parent().addClass("focus-input");
                    $(this).siblings(".wizard-form-error").hide();
                }
            });
  

}
}
