---
layout: post
title: "Allow One User To Access Multiple Users Calendar In Exchange Server Using Power Shell"
date: 2015-03-27 09:00:00
tags: exchange ews powershell
categories: dev
---

IVS has been released for 2 months. It runs pretty good. However, some customers complain about missing subject when viewing free/busy info. The workflow is they want to see the subject to know if it's ok to conflict.

EWS is able to get subject if [FreeBusyViewType](https://msdn.microsoft.com/en-us/library/office/aa563929(v=exchg.150).aspx) is set to `Detailed`. This is the default value when getting [GetUserAvailability](https://msdn.microsoft.com/en-us/library/microsoft.exchange.webservices.data.exchangeservice.getuseravailability(v=exchg.80).aspx). During my testing against outlook 365, [CalendarEventDetails](https://msdn.microsoft.com/en-us/library/exchangewebservices.calendarevent_properties(v=exchg.80).aspx) is always null unless I'm getting my own free/busy info.

It turns out we need to add permission to allow one user to view others detailed free/busy info. There're 3 ways.

1. All target users needs to authorize calendar permission to IVS scheduler in outlook. The default permission is free/busy only.

2. IVS scheduler needs to send permission request by clicking "share calendar" in outlook.

3. <p name="num3">Exchange Admin can set permission via power shell. A batch update is possible.</p>

 [\#3](#num3) is preferable. IT can run a script to get things done instead bothering end users to change this manually. Below is the details.

### connect to remote exchange server ###

```
$session = New-PSSession -ConfigurationName Microsoft.Exchange -ConnectionUri "https://ps.outlook.com/powershell/" -Credential $cred -Authentication Basic -AllowRedirection
```
There will a popover to enter your admin crendentials. This may only work for outlook 365, the url needs to be replaced if necessary.

### create session ###

```
Import-PSSession $session
```
During seesion import, it will start load Exchange cmdlets to local.

You might get below errors.  

> PS C:\Users\Dan> Import-PSSession $session
WARNING: Proxy creation has been skipped for the following command: ‘TabExpansion’, because it would shadow an existing
local command. Use the AllowClobber parameter if you want to shadow existing local commands.

You need to set your execution policy.

```
Set-ExecutionPolicy RemoteSigned
```

After connection is established successfully, try below cmdlet

```
get-mailbox
```
you should see a list of all users in your organization.


### set permission ###

[Add-MailboxFolderPermission](https://technet.microsoft.com/en-us/library/dd298062(v=exchg.141).aspx), 
[Set-MailboxFolderPermission](https://technet.microsoft.com/en-us/library/ff522363(v=exchg.141).aspx)

```
add-MailboxFolderPermission -identity ivan_owner@abc.com:
\Calendar -User ivan_scheduler@abc.com -accessrights LimitedDetails
```

This will add permission if it doesn't exist. However, it will throw error if duplicate is found. In this case, Set-MailboxFolderPermission needs to be used.

It would be more convienient if there's an param to ignore the duplicate. Unfortunately there seems to be no.

### close session ###

*Be sure to disconnect the remote PowerShell session when you're finished. If you close the Windows PowerShell window without disconnecting the session, you could use up all the remote PowerShell sessions available to you, and you'll need to wait for the sessions to expire. To disconnect the remote PowerShell session, run the following command.*

```
Remove-PSSession $Session
```

This is just the basic of how to allow one user to access to multiple users. We need to write a ps script finally to get this done. We needs to allow a list of users from external files.












Reference
[[1]](https://technet.microsoft.com/en-us/library/jj984289(v=exchg.150).aspx)
[[2]](http://careexchange.in/working-with-calendar-permissions-in-bulk-on-exchange-2010-sp2/)

