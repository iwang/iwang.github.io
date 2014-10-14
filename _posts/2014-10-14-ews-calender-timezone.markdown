---
layout: post
title:  "EWS Timezone issue when dealing with calender"
date:   2014-10-14 17:27:05
tags: ews mail
categories: work
---

I've been working on a pretty easy task today (I thought it was easy at least). I want to save calender to a user then get free/busy info later from the user. All this is through [java ews API](https://github.com/OfficeDev/ews-java-api)

###### send calender

{% highlight java %}
SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
Date startDate = formatter.parse("2014-10-14 15:00:00");
Date endDate = formatter.parse("2014-10-14 16:00:00");
appointment.setStart(startDate);
appointment.setEnd(endDate);
appointment.save();
{% endhighlight %}

###### check free/busy

{% highlight java %}
SimpleDateFormat sf = new SimpleDateFormat("yyyy-MM-dd");
// only accurate to day, start=2014-10-14 12:00&&end=2014-10-14 13:00 is invalid
startDate = sf.parse("2014-10-14");
endDate = sf.parse("2014-10-16");
List<AttendeeInfo> attendees = new ArrayList<AttendeeInfo>();
attendees.add(new AttendeeInfo("hermione@deliverymethod.hostpilot.com"));

GetUserAvailabilityResults results = service.getUserAvailability(
        attendees,
        new TimeWindow(startDate, endDate),
        AvailabilityData.FreeBusy);
{% endhighlight %}

Quite straightforward so far. However, the result is totally unexpected. The time I scheduled in the code, I saw in outlook web application, I got from free/busy API are all different! What the hell is going on here? 

##### 1. When creating appointment, timezone information needs to be set into formatter

Otherwise it will send local date. e.g. If tHe start time is 15:00:00 (PST), exchange server will also get 15:00:00 (PST). I misunderstood below statement in it's documentation. "in UTC time" actually means you have to parse the date to UTC explicitly. 

> Time and date details that you set by using the java.util.Date class are given as UTC. When you set the date by using the Date class, make sure that it is in UTC time.

{% highlight java %}
formatter.setTimeZone(TimeZone.getTimeZone(USER_TZ));
{% endhighlight %}

##### 2. The returned date in free/busy info is always in UTC. You have to convert it to readable time in user's timezone.

{% highlight java %}
private static Date fromUTC(Date date, TimeZone tz) {
    return new Date(date.getTime() + tz.getOffset(date.getTime()));
}
{% endhighlight %}
