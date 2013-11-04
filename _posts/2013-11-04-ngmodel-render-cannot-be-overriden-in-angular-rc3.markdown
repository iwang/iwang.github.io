---
layout: post
title:  "Why ngModel's $render function can't be overriden in AngularJS rc3?"
date:   2013-11-04 14:21:05
tags: css center centering layout position
categories: html angular angularjs
---

# $render

The other day I asked a team member to [ui-tinymce](https://github.com/angular-ui/ui-tinymce) into our project. A half day later, he told me that it doesn't work with Angular rc3 while rc2 is ok. But he found some guy reported the same [issue](https://github.com/angular/angular.js/issues/4560) and got a workaround from [another thread](https://github.com/angular-ui/ui-tinymce/issues/49)

The issue is all about $render function isn't called when model is actually changed. So no content can be set into tinymce.

{% highlight javascript %}
return {
    require: 'ngModel',
    ..........
    ngModel.$render = function() {
        if (!tinyInstance) {
            tinyInstance = tinymce.get(attrs.id);
        }
        if (tinyInstance) {
            tinyInstance.setContent(ngModel.$viewValue || '');
        }
    };
}
{% endhighlight %}

What this library did is very common when you want to wrap a 3rd party library into Angular. $render is what you need to set the value back into the 3rd party widget given any change. But this function never gets called if using Angular rc3!

I got some time to look into this issue today. I dived into Angular's source and found what it says about *$render* orginally.

{% highlight javascript %}
 /**
   * @ngdoc function
   * @name ng.directive:ngModel.NgModelController#$render
   * @methodOf ng.directive:ngModel.NgModelController
   *
   * @description
   * Called when the view needs to be updated. It is expected that the user of the ng-model
   * directive will implement this method.
   */
  this.$render = noop;
{% endhighlight %}  

It is empty in the first place and should be implemented by the user. That's what the author of the ui-tinymce did so far. It is supposed to be working. To diagnose this issue, I decided to find where this function is called by Angular. It's still in NgModelController a few lines below the defination of $render.

{% highlight javascript %}
// model -> value
var ctrl = this;

$scope.$watch(function ngModelWatch() {

  var value = ngModelGet($scope);

// if scope model value and ngModel value are out of sync
if (ctrl.$modelValue !== value) {

  var formatters = ctrl.$formatters,
      idx = formatters.length;

  ctrl.$modelValue = value;
  while(idx--) {
    value = formatters[idx](value);
  }

  if (ctrl.$viewValue !== value) {

    ctrl.$viewValue = value;
    // IW added: This is where ngModel Ctrl call the $render
    // console.log("$render is called in the watch");
    ctrl.$render();
  }
}
});
{% endhighlight %} 

Check the bottom line, if the value changes, $render will be called. I put some log right below where I added the comment. And I also added some log when $render is called in ui-tinymce. The former works as expected but the latter never gets called. Obviously, the $render is not the one defined in ui-tinymce. I have to dig more into this. I logged the $render function, it was 

{% highlight javascript %}
element.val(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);
{% endhighlight %} 

I searched Angular's source code and found the definition of this function
{% highlight javascript %}
function textInputType(scope, element, attr, ctrl, $sniffer, $browser) {
.....
ctrl.$render = function() {
    element.val(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);
};
}
{% endhighlight %}

I added some log above it and witneessed that this definition is called after the counterpart in ui-tinymce. I then switched to rc2, verified the result is on the contrary. 

It's now clear that the root cause of the issue is that the link function in ui-tinymce is called earlier in rc3. There must be more than one directive defined on the element, the order of the link function is controlled by the priority property. 

# directive's priorty

It occurs to me there's some change log in Angular rc3's [changelog](https://github.com/angular/angular.js/blob/master/CHANGELOG.md) talking about the directive priority change.

> Previously the compile/link fns executed in this order controlled via priority:
>
> * CompilePriorityHigh, CompilePriorityMedium, CompilePriorityLow
> * compile child nodes
> * PreLinkPriorityHigh, PreLinkPriorityMedium, PreLinkPriorityLow
> * link child nodes
> * PostLinkPriorityHigh, PostLinkPriorityMedium, PostLinkPriorityLow
>
> This was changed to:
>
> * CompilePriorityHigh, CompilePriorityMedium, CompilePriorityLow
> * compile child nodes
> * PreLinkPriorityHigh, PreLinkPriorityMedium, PreLinkPriorityLow
> * link child nodes
> * PostLinkPriorityLow, PostLinkPriorityMedium , PostLinkPriorityHigh

> Very few directives in practice rely on order of postLinking function (unlike on the order of compile functions), so in the rare case of this change affecting an existing directive, it might be necessary to convert it to a preLinking function or give it negative priority (look at the diff of this commit to see how an internal attribute interpolation directive was adjusted).

The first attempt is to find what is the priority of the ngModel directive. Searching through the source code, I didn't find any. With a safe guess, it would be 0 by default. I added the priority of 10 in ui-tinymce, the whole thing gets back to work again, I can see from the log our customized link function is called after the native one. 

# The Mystery

I can call it a day if I want because the issue if fixed. But I still leaves some questions unsolved? 

* I can't even name the directive by calling it "the native one"
* Actually rc3 didn't change the priority related to this issue, both directives have default priority "0" in this case. Why the order changes between rc2 and rc3?


## directive under the hood

There's some directive added by Angular implicitly during initialization, like `input`, `textarea`, `form`. Despite the name, it's actual an Angular diretive. This is very import and may sould confusing when you first come to it. I think why Angular doesn't pre-define those directives as `ng-input`, `ng-textarea` is to leave user no choice but always stick to them. Otherwise if I don't want to use `ng-input`, I can switch to `input` by simply use `input` tag. 
All the native Angular directive name actually goes with a directive, the rule is defined as below. I'd like to list them all because it helps me understand other stuff which I thought was magic before. During the compiling phase, Angular will go through the DOM and do the name-and-directive matching. Native directive will use beflow rule and customized one will use "same name matching". rule. e.g. `data-ng-input` will be normalized into `input` and goes with `inputDirecive`. `data-ng-customized-div` will be normalized into `customizedDiv` and go with `customizedDiv` directive.
{% highlight javascript %}
angularModule('ng', ['ngLocale'], ['$provide',
    function ngModule($provide) {
      $provide.provider('$compile', $CompileProvider).
        directive({
            a: htmlAnchorDirective,
            input: inputDirective,
            textarea: inputDirective,
            form: formDirective,
            script: scriptDirective,
            select: selectDirective,
            style: styleDirective,
            option: optionDirective,
            ngBind: ngBindDirective,
            ngBindHtml: ngBindHtmlDirective,
            ngBindTemplate: ngBindTemplateDirective,
            ngClass: ngClassDirective,
            ngClassEven: ngClassEvenDirective,
            ngClassOdd: ngClassOddDirective,
            ngCsp: ngCspDirective,
            ngCloak: ngCloakDirective,
            ngController: ngControllerDirective,
            ngForm: ngFormDirective,
            ngHide: ngHideDirective,
            ngIf: ngIfDirective,
            ngInclude: ngIncludeDirective,
            ngInit: ngInitDirective,
            ngNonBindable: ngNonBindableDirective,
            ngPluralize: ngPluralizeDirective,
            ngRepeat: ngRepeatDirective,
            ngShow: ngShowDirective,
            ngStyle: ngStyleDirective,
            ngSwitch: ngSwitchDirective,
            ngSwitchWhen: ngSwitchWhenDirective,
            ngSwitchDefault: ngSwitchDefaultDirective,
            ngOptions: ngOptionsDirective,
            ngTransclude: ngTranscludeDirective,
            ngModel: ngModelDirective,
            ngList: ngListDirective,
            ngChange: ngChangeDirective,
            required: requiredDirective,
            ngRequired: requiredDirective,
            ngValue: ngValueDirective
        }).
        directive(ngAttributeAliasDirectives).
        directive(ngEventDirectives);
      $provide.provider({
        $anchorScroll: $AnchorScrollProvider,
        $animate: $AnimateProvider,
        $browser: $BrowserProvider,
        $cacheFactory: $CacheFactoryProvider,
        $controller: $ControllerProvider,
        $document: $DocumentProvider,
        $exceptionHandler: $ExceptionHandlerProvider,
        $filter: $FilterProvider,
        $interpolate: $InterpolateProvider,
        $interval: $IntervalProvider,
        $http: $HttpProvider,
        $httpBackend: $HttpBackendProvider,
        $location: $LocationProvider,
        $log: $LogProvider,
        $parse: $ParseProvider,
        $rootScope: $RootScopeProvider,
        $q: $QProvider,
        $sce: $SceProvider,
        $sceDelegate: $SceDelegateProvider,
        $sniffer: $SnifferProvider,
        $templateCache: $TemplateCacheProvider,
        $timeout: $TimeoutProvider,
        $window: $WindowProvider
      });
    }
  ]);
}
{% endhighlight %}

Let's get to the `inputDirecive`. 
{% highlight javascript %}
var inputDirective = ['$browser', '$sniffer', function($browser, $sniffer) {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function(scope, element, attr, ctrl) {
      if (ctrl) {
        (inputType[lowercase(attr.type)] || inputType.text)(scope, element, attr, ctrl, $sniffer,
                                                            $browser);
      }
    }
  };
}];
{% endhighlight %}

In the `link` function, it will find the base link function it will use. We didn't specify any type in the textarea tag, so it will use "text" as the default.
"text" goes with `textInputType`
{% highlight javascript %}
var inputType = {
'text': textInputType,
'number': numberInputType,
....
}
{% endhighlight %}

## textInputType

What is `textInputType`. It's a link function for all input element. It adds some common functions on ngModel controller and some event listener. It also addes validation. It also provide a default implementation for some `noop` function defined in ngModelController. `$render` is one of it. But you can override it in your link, like ui-tinymce does.
In our case, there're actually 3 directives bound to `textarea`, let's take a close look at them. 'textarea' is the implicit directive which has textInputType as its link function.

{% highlight javascript %}
{
name: 'textarea',
index: 0,
priority: 0,
require: '?ngModel',
restrict: "E"
}

{
name: 'uiTinymce',
index: 0,
priority: 10,
require: 'ngModel'
restrict: "A"
}


{
name: "ngModel",
index: 0,
priority: 0,
require: {"^ngModel", "^?form"},
restrict: "A"
}

{% endhighlight %}

If 2 directives on the same element both override the same function on ngModelController, how does Angular determine the order? well, Let's look at this.
{% highlight javascript %}
 function collectDirectives(node, directives, attrs, maxPriority, ignoreDirective) {
 ......
    directives.sort(byPriority);
    return directives;
 
 }
{% endhighlight %}

It's the sort function `byPriority` that makes the call and `priority` plays an important role. rc3 and rc2 are totally different. In rc3, it will compare the name and index if priorty is the same. 

{% highlight javascript %}
// rc3
function byPriority(a, b) {
  var diff = b.priority - a.priority;
  if (diff !== 0) return diff;
  //IW: larger name has a lower order, different from priority comparison
  if (a.name !== b.name) return (a.name < b.name) ? -1 : 1;
  return a.index - b.index;
}

//rc2
function byPriority(a, b) {
  return b.priority - a.priority;
}
{% endhighlight %}

In our case, because `uiTinymce` is larger than `textarea` in string comparison, in contrast, it has a lower priority than `textarea`. According to the rule, lower priority directive is post-linked before higher one, so that's why our $render is always overriden by the default one.

The original order is [`textarea`, `uiTinymce`, `ngModel`]. In rc2, because lower priority directive will be post-linked after higher one, `uiTinymce` is linked after `textarea`. I'm going to take a look at how Angular gets these directives. But now, I'm going to call it a day.