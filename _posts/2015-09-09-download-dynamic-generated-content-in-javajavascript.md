---
layout: post
title: "Download dynamic generated content in java/javascript"
description: ""
category: dev
tags: [java, servlet, javascript]
---

#### Download dynamic generated content (not file)  from back-end

We have some report which is not generated as a file in advance. Current we use 2 requests.

1. generate the report as a temp file and put filename in the response
2. download the temp file using the filename

Obviously it's unnecessary. One request should be enough. No temp file is necessary. The content should directly goes into the ServletOutputStream.

I thought the wrong way firstly. The generated content should be converted to a inputstream which finally can be copied to the ServletOutputStream. Sounds like a plan, isn't it? I even found Apache common-io `IOUtils` to copy the stream.

After several minutes, I figured I'm heading the incorrect direction. Basically input stream is to read, output stream is to write. How can I read the content if it's not generated yet. 

Then I came into [this](http://stackoverflow.com/questions/4069028/write-string-to-output-stream). I can create a writer from the output stream and write the content into the writer.  

This works well when csv file is generated on the fly. However, the report can also be xls. We're using a very outdated POI version so the entire workbook needs be created before putting to other output.  It has a `write` function to write the bytearray into the output stream.  This may have potential OutOfMemory issue, but for now, this should be safe due to the expected size of the file.

1. no need to close ServletOutputStream because it's not opened by you. [here][1]

> Thumb rule: if you didn't create/open it yourself using new SomeOutputStream(), then you don't need to close it yourself. If it was for example a new FileOutputStream("c:/foo.txt"), then you obviously need to close it yourself.

2. servlet container will flush the output stream by default every certain size [here][2]

> The average decent servletcontainer itself flushes the stream by default every ~2KB. You should really not have the need to explicitly call flush() on the OutputStream of the HttpServletResponse at intervals when sequentially streaming data from the one and same source. In for example Tomcat (and Websphere!) this is configureable as bufferSize attribute of the HTTP connector


#### Download file using ajax

This is much more complicated than I thought it should be.  Below is options I've found.

1. The HTML5 `download` attribute for `<a>` tag is not supported in IE 10, 11.  
2. Add `<a>` link dynamically to force the download
3. Change `window.href` using the download link or open it in new tab

Finally I go for #3, the same as what we did now. I thought there should be more decent/modern solution around but no luck. Some side effect I've found when using #3, especially in Chrome.

1. additional request to load ico will be sent from the network tab in Chrome. Firefox may do the same but not visible from its network screen.
2. Some console warning will be found as below.

> Resource interpreted as Document but transferred with MIME type application/octet-stream:

3. If the download link ran into back-end error, the page will be redirected to the error page.  In this case, open the download link in the new tab would be better.

Another issue is to append the query string into the download link. In my case i have a `params` object which contains all the parameters back-end needs to know to generate the download file. It looks like this

``` javascript
params: {
	pageNo: 1,
	columns: [0, 3, 4, 5]
}
```
When I use jQuery's [`param`][3] to serialize the object, I got below result. 

` pageNo=1&columns%5B%5D=0&columns%5B%5D=3&columns%5B%5D=4&columns%5B%5D=5`

after decoding this, it looks like below

`pageNo=1&columns[]=0&columns[]=3&columns[]=4&columns[]=5`

Struts2 cannot recognize this [here][4].  I need to use the traditional way to serialize  it. `$.param(params, true)`.  I got below result:

`pageNo=1&columns=0&columns=3&columns=4&columns=5` 

The downside of using traditional  way is that it cannot serialize deeper object recursively.  You will get `[object+Object]` if the value itself is still an object. [here][3]

[1]: http://stackoverflow.com/questions/1829784/should-i-close-the-servlet-outputstream 
[2]: http://stackoverflow.com/questions/685271/using-servletoutputstream-to-write-very-large-files-in-a-java-servlet-without-me 
[3]: http://api.jquery.com/jquery.param/ 
[4]: http://stackoverflow.com/questions/29805017/send-array-to-struts2-action-with-jquery-ajax-call 