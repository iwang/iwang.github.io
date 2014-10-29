---
layout: post
title:  "EWS issues collected"
date:   2014-10-29 14:46:05
tags: ews mail
categories: work
---

# 1. enable debug #

It turns out EWS API doesn't have native debug logging capability. [here](http://msdn.microsoft.com/en-us/library/office/dd633676(v=exchg.80).aspx)

    service.setTraceEnabled(true);
    service.setTraceFlags(EnumSet.allOf(TraceFlags.class));
    service.setTraceListener(new ITraceListener() {
        
        @Override
        public void trace(String traceType, String traceMessage) {
            System.out.println(traceMessage);
        }
    });

# 2. add attachments to appointment #

Adding attachments into appointment is very straightforward. However, the attachment doesn't appear in the email no matter using outlook 2013 or outlook web app.
However, you can download the attachment by using ews to get the appointment. 

It turns out adding attachment successfully requires an [update](https://social.msdn.microsoft.com/Forums/exchange/en-US/cf4b9d9a-7bbb-4caa-9d55-300371fa84ac/ews-attachment-not-sent-with-invitation). 
The trick is to save the appointment with attachments first. Then add attendees and make an update.

    appointment.getAttachments().addFileAttachment("C:/Users/ivan.wang/Downloads/aaa.txt");
    appointment.save();

    appointment.getRequiredAttendees().add("DEV1", "dev1@deliverymethod.hostpilot.com");
    appointment.update(ConflictResolutionMode.AutoResolve, SendInvitationsOrCancellationsMode.SendOnlyToAll);

# 3. link response message with the original appointment #

We use our app to send appointment and check response then update the status back to our app. Only conversationId can be used here to link response message with the appointment. However, if the subject has "re: ", "fw: ", etc. as prefix (no more than 3 characters), the message will be squashed into one conversation automatically. e.g. We sent 3 invites to 3 guys, they should have different conversation id which was saved into our system. If they replied, the 3 invites will have the same conversation id. Thus, we have no idea which appointment the response points to. Adding additional property doesn't work, you can only add it in appointment but it will tag along with the response message.
We just removed the prefix if exists, it's acceptable because it can't appear in outlook anyway. 

[1] http://support.microsoft.com/kb/197172/EN-US

[2] http://wp.ofl.me/index.php?p=2081

 
