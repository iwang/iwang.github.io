---
layout: post
title:  "Center element above with unfixed width"
date:   2013-09-25 00:27:05
tags: css center centering layout position
categories: html css
---

The issue I got with centering is a little bit different from what I could find with a solution. Here's the thing.

Say I have an icon, I need to display a label of the icon name right above it. The icon and the label needs to be horizontally aligned.
![screen shot]({{site.url}}/assets/2013-09-25-center-element-above-with-unfixed-width-1.PNG)

The general centering issue is center some element in a container, whether the width of the element is fixed or not will make it more or less complicated, but anyway, it can be solved.
Something I found [here](http://css-tricks.com/centering-in-the-unknown/) may be useful later.

Since the label is above the icon, outside it's container. Moving it out of the document flow is a pretty straightforward idea, let's use `absolute` position. All the solutions I found is talking about centering inside, now the label is outside its container, ways like table layout can't apply.

However, I do need a container. If I can make the container center aligned, maybe things are getting better. I already know how to center something if width is fixed. 

{% highlight css %}
.wrapper {
    left: 50%;
    margin-left: -150px;
}
{% endhighlight %}

Despite the fact that the label's width is not fixed, I know it won't large than some extent, like 200px. If I add a container with 200px width to it, make container centered, then make itself centered in the container, problem solved.

{% highlight html %}
<div class="wrapper"  ng-show="isCurrent">
    <p>{{ statusName }}<p>
</div>

.wrapper {
    width: 300px;
    top: -5px;
    height:20px;
    position: absolute;
    left: 50%;
    margin-left: -150px;
    text-align: center;
}
{% endhighlight %}

So far looks great. the label aligns centered with `text-align: center`

![screen shot]({{site.url}}/assets/2013-09-25-center-element-above-with-unfixed-width-2.PNG)

Now I'm trying to add background. add `background-color` to `<p>` won't work, because the width of `<p>` is actually 100%. The background color will be covered all around. 

![screen shot]({{site.url}}/assets/2013-09-25-center-element-above-with-unfixed-width-3.PNG)

I need some container that only extends to it's container's width, I'm lucky to try `span` in the first place. It works like a charm.
I found [this](http://hiox.org/6576-block-vs-inline-level-elements.php) explains well the difference between `div` and `span`.
Another solution after reading it is to change `<p>` to `display:inline`


Below is what I copied above, thanks to the author.

The characteristics of block elements `<div>, <p>, <h1>, <form>, <ul> and <li>` include:

* Always begin on a new line
* Height, line-height and top and bottom margins can be manipulated
* Width defaults to 100% of their containing element, unless a width is specified

The characteristics of inline elements `<span>, <a>, <label>, <input>, <img>, <strong> and <em>`, on the other hand, are the opposite of block elements:

* Begin on the same line
* Height, line-height and top and bottom margins can't be changed
* Width is as long as the text/image and can't be manipulated


To change an element's status, you can use display: inline or display: block. But what's the point of changing an element from being block to inline, or vice-versa? Well, at first it may seem like you might hardly ever use this trick, but in actual fact, this is a very powerful technique, which you can use whenever you want to:

* Have an inline element start on a new line
* Have a block element start on the same line
* __Control the width of an inline element (particularly useful for navigation links)__
* Manipulate the height of an inline element
* Set a background colour as wide as the text for block elements, without having to specify a width






