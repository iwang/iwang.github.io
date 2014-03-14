---
layout: post
title:  "invoking web service via CXF causes all https requests blocked afterwards"
date:   2014-03-14 18:27:05
tags: java
categories: support
---


Recently we upgraded to Jboss 7 along with JDK 7, including Spring upgrade. That's a big change. After I sorted out the EJB/JMS/Mail Service migration from Jboss 4.0.3GA, it was time to go live. We took it alive last Saturday, several hours later, something went wrong. We couldn't access one of our web servers directly. And it was restarted by our administrator even before I got a chance to poke around. 

I checked the server log, no requests logged in the access log. The request must be rejected before it went into filters (we use filter to log access information).

Worse still, I didn't even find out how to reproduce it yet. I spent a whole day without any luck. Feeling too risky to keep it running on Monday, we roll back to Jboss 4. 

Our administrator reported a ticket to Redhat since we bought the EAP license.

The next day, it was reported that another staging server just got the same problem. I tried it: Chrome says "ERR_SSL_VERSION_OR_CIPHER_MISMATCH" while Firefox says "ssl_error_internal_error_alert". However, it worked just fine in IE.

I thought there should be something that changes the so called server "ssl strategy". There's little access info in our staging server, I checked it one by one. Finally I located the one that I could reproduce the issue locally. It was one request that would invoke an web service. The endpoint is https url and we're using CXF to do that. I tried various ways like adding fake trusted manager, upgrading CXF to latest version, setting a sesstionCacheTimeout. None of them worked. 

The Redhat support came in time. He told us to [open the ssl](https://access.redhat.com/site/solutions/49082) debug mode by adding below params:

```bash
JAVA_OPTS="$JAVA_OPTS -Djavax.net.debug=all"
```

It turned out to be the "DH keypair" error.

```bash
stdout - %% Initialized:  [Session-10, SSL_NULL_WITH_NULL_NULL]

stdout - http-/0.0.0.0:443-8, handling exception: java.lang.RuntimeException: Could not generate DH keypair
```

I googled the error and came across [this](ttp://stackoverflow.com/questions/10687200/java-7-and-could-not-generate-dh-keypair).

I changed the cipher suite in https connectors

```xml
<ssl ... cipher-suite="SSL_RSA_WITH_RC4_128_MD5,SSL_RSA_WITH_RC4_128_SHA,TLS_RSA_WITH_AES_128_CBC_SHA,TLS_DHE_RSA_WITH_AES_128_CBC_SHA,TLS_DHE_DSS_WITH_AES_128_CBC_SHA,SSL_RSA_WITH_3DES_EDE_CBC_SHA,SSL_DHE_RSA_WITH_3DES_EDE_CBC_SHA,SSL_DHE_DSS_WITH_3DES_EDE_CBC_SHA,SSL_RSA_WITH_DES_CBC_SHA,SSL_DHE_RSA_WITH_DES_CBC_SHA,SSL_DHE_DSS_WITH_DES_CBC_SHA,SSL_RSA_EXPORT_WITH_RC4_40_MD5,SSL_RSA_EXPORT_WITH_DES40_CBC_SHA,SSL_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA,SSL_DHE_DSS_EXPORT_WITH_DES40_CBC_SHA,TLS_EMPTY_RENEGOTIATION_INFO_SCSV"/>
```

Everything was back to be working. What I just did was make the DH crypt less likely to negotiate. Still, I haven't got to the bottom of it. What exactly did CXF change? 

The support guy was very experienced. He told us to use [Byteman]http://www.jboss.org/byteman/downloads.html to find out the [root cause](https://access.redhat.com/site/solutions/31283). Byteman was VERY powerful, it could inject anything you want to any class including the 3rd library. We'll use byteman to print the stacktrace to see the actual cause. Below is the script (examplescript.btm):

```bash
RULE log SSL exceptions
CLASS SSLSocketImpl 
METHOD handleException(java.lang.Exception, boolean)
AT ENTRY
IF TRUE
DO System.out.println("SSL Exception in " + Thread.currentThread().getName());
$1.printStackTrace();
ENDRULE
```

To integrate byteman with Jboss, just add below command 

```bash
JAVA_OPTS="$JAVA_OPTS -javaagent:<mypath>/lib/byteman.jar=script:<mypath>/examplescript.btm,boot:<mypath>/lib/byteman.jar"
```

From the tracestack, the actual cause was `parameter object not a ECParameterSpec`. It was not helpful to me until I saw `org.bouncycastle.jce.provider.JDKKeyPairGenerator` in the stack. Bouncy Castle was said to be the root cause of such problem, the support guy mentioned it earlier. 

>Java 1.5 introduced a change to the elliptical curve cryptography API. If you use a Java Cryptography Extension (JCE) >provider intended for Java 1.4 or earlier it will not support this new API change and there may be errors with >Diffie-Hellman based ciphers when using SSL. The SSL implementation attempts to setup elliptical curve cryptography >with a ECGenParameterSpec object. This object wasn't added to until Java 1.5: >http://docs.oracle.com/javase/7/docs/api/java/security/spec/ECGenParameterSpec.html (Notice the Since line).

>For example, the bcprov-jdk14-131-1.0.jar is Bouncy Castle which is one such provider. This version of the provider >is intended for JDK 1.4. Bouncy Castle provides different libraries for each JDK level.

It was a dependency of pdfbox. We used it to extract text from pdf and generate pdf. Currently we're still using  bcprov-jdk14. After I upgraded it to bcprov-jdk15, we couldn't reproduce the issue any more.

When we invoked CXF, it found the Bouncy Castle and [registered](http://docs.oracle.com/cd/E19879-01/820-4335/6nfqc3qmq/index.html) it as a JCA/JCE cryptography provider. And later coming https request used this provider. 

Jboss should have a JCE order list, and Bouncy Castle should have a higher priority. Once the library is found, Jboss will use it instead. `Cipher.getInstance("RSA/ECB/PKCS1Padding")` can view the current used JCE.
 

