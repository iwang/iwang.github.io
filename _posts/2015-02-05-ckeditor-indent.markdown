---
layout: post
title: "CKEditor indent"
date: 2015-02-05 13:40:00
tags: rte
---

Customer reports an issue about CKEditor disabling the indent button. At first glance, I thought it was by default. User needs to select some text and converts it to a list to use this functionality. Later, I found the editor in CKEdtior's [official site](http://ckeditor.com) doesn't have the issue at all!

It turns out you need to enable this by installing 2 plugins: [indent](http://ckeditor.com/addon/indent) and [indentblock](http://ckeditor.com/addon/indentblock). Actually it's already included in the ckeditor build we're using. You can check that by finding keyword "indent" and "indentblock" in ckeditor.js. 

However, this still doesn't work for me. It took me an hour to find out the root cause. For legacy issue, we set `entermode` to `div`, default is `p`, and another option is `br`. Below is the code which makes the button disabled.

{% highlight javascript %}
this.requiredContent = (this.enterBr ? "div" : "p") + (d ? "(" + d.join(",") + ")" : "{margin-left}");
{% endhighlight %}

It seems as long as `entermode` is not `br`, it's using `p`. That's incorrect. `divMode` should also use `div` as requiredContent. 


{% highlight javascript %}
this.enterBr = a.config.enterMode == CKEDITOR.ENTER_BR;
{% endhighlight %}

refined to

{% highlight javascript %}
this.enterBr = a.config.enterMode == CKEDITOR.ENTER_BR || a.config.enterMode == CKEDITOR.ENTER_DIV;
{% endhighlight %}

After this, the button will be enabled. Adding margin-left will not be removed in div by ckeditor.
