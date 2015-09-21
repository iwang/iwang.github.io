---
layout: post
title: "PKIX path building failed when invoking EWS API"
description: ""
category: dev
tags: [ews]
---

We got below exception when one of customers uses our EWS API to connect to their Exchange. 
>The request failed. The request failed. sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target

The root cause is that the cert's CA is not in Java's trusted list. Solution is pretty simple.

1. Get the cert. There're 2 optioins. 
	- Open it in Firefox and view the cert details from address bar's top-left.  Click "export". [here](http://superuser.com/questions/97201/how-to-save-a-remote-server-ssl-certificate-locally-as-a-file). 
	- get the cert from CA directly. URLcan be found from cert details ("Issued By" part). [This](https://certs.secureserver.net/repository/) is the one I found for [StarFieldTech](https://www.starfieldtech.com/).
2. import the cert into jdk's keystore file `%JAVA_HOME%\lib\security\cacerts` 

```bash
keytool -import -alias starfieldrootg2 -file sfroot-g2.crt -keystore "%JAVA_HOME%/jre/lib/security/cacerts"
```

Other command may be used
1. list all certs added to keystore

```bash
keytool -list -keystore "%JAVA_HOME%/jre/lib/security/cacerts"
```

2. remove cert from keystore

```bash
keytool -delete -alias targetname -keystore "%JAVA_HOME%/jre/lib/security/cacerts"
```