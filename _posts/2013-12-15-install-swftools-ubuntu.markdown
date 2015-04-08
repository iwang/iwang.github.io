---
layout: post
title:  "Install Swftools in Ubuntu"
date:   2013-12-15 18:27:05
tags: swftools
comments: false
categories: miranda
---

I've been implementing the Doc viewer feature 2 years ago. [Swftools](http://www.swftools.org/) is a core part. But we're using Windows environment, we could get the compiled package directly, namely `pdf2swf.exe`.

However, when I tried to get it installed in my Ubuntu 13.10 by following [this](http://wiki.swftools.org/wiki/Installation), I virtually had a hard time. Then I found [this](https://designbye.wordpress.com/2010/02/23/installing-swftools-and-pdf2swf-on-ubuntu-linux/) useful link, I'd rather take some note here.

# It requires 2 additional libraries

## jpeglib

`jpeglib` can be found [here](http://www.ijg.org/files/). But it's said v8+ is not compatible with current Swftools, so I installed v7.

{% highlight bash %}
wget http://www.ijg.org/files/jpegsrc.v7.tar.gz
tar -zvxf jpegsrc.v7.tar.gz

cd jpeg-7
sudo ./configure
sudo make
sudo make install
{% endhighlight %}

## freetype

The latest version is 2.5.2, installing it is a little tricky.

{% highlight bash %}
wget http://download.savannah.gnu.org/releases-noredirect/freetype/freetype-2.5.2.tar.gz
tar -zvxf freetype-2.5.2.tar.gz

cd freetype-2.3.12
rm -f config.cache
sudo ranlib /usr/local/lib/libjpeg.a
sudo ldconfig /usr/local/lib
sudo LDFLAGS="-L/usr/local/lib" CPPFLAGS="-I/usr/local/include" ./configure
sudo make
sudo make install

{% endhighlight %}

## install Swftools

{% highlight bash %}
cd swftools-0.9.0
sudo LDFLAGS="-L/usr/local/lib" CPPFLAGS="-I/usr/local/include" ./configure
sudo make
sudo make install
{% endhighlight %}

# "rm: invalid option -- o"

When you `make install` Swftools, you might get this error. This bug should be fixed in 0.9.3, but I'm using 0.9.2, some workaround needs to be done.

refine `swfs/Makefile`, remove below line

{% highlight bash %}
-o -L $(pkgdatadir)/swfs/default_loader.swf
{% endhighlight %}


