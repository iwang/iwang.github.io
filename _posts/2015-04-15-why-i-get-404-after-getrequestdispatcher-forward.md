---
layout: post
title: "Why I get 404 after getRequestDispatcher forward"
description: ""
category: dev
tags: [java, servlet, spring, struts]
---

# Start from Spring Security #

Last year I upgraded acegi to [Spring Security]([http://projects.spring.io/spring-security/). When authentication fails, Spring Security will redirect the request. 

```xml

 <sec:form-login login-page='/login'
             username-parameter="username" password-parameter="password"
             authentication-failure-handler-ref="authenticationFailureHandler"
             authentication-success-handler-ref="authenticationSuccessHandler" 
             login-processing-url="/loginSuccess"/>

 <bean id="authenticationFailureHandler"
        class="com.ivan.LoginFailureHandler">
 </bean> 

```

The redirect is done in `LoginFailureHandler`. 

``` java

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
	                                    AuthenticationException exception) throws IOException, ServletException {
		.....
		.....
		getRedirectStrategy().sendRedirect(request, response, url)
	
	}

```

Ideally, we should send forward to some internal struts action to do post-authentication stuff. Business logic shouldn't be added to authenticationFailure/authenticationSuccess handler. Instead, struts needs to proceed the request and send response both when authentication fails or succeeds. 

However, if we use `request.getRequestDispatcher('postLogin.action').forward(request, response)`, we get `404` error. Server complains that it cannot find any mapper to handle `/postLogin.action`. However, this action exists for sure.

My previous assumption is that this is about forwarding request from Spring to Struts. At that point, I had no time to dig more into this. So redirect was used 
    
# Not Spring Security Only #

Recently, we're making a big change of authentication. One thing is to change `/login.html` to `/login`. Under the hood, `/login` is filtered and forward to `login.action`. Struts then renders the result depending on the url parameters. 

We then got the `404` again when forwarding `/login` to `login.action`. A quick solution is forwarding to `login.jsp` instead of using struts. But this time, I'd like to look into this issue.

# All about filter mapping #

I found below in servlet 3.0 spec.

> By using the new <dispatcher>element in the deployment descriptor, the 
developer can indicate for a filter-mappingwhether he would like the filter to be 
applied to requests when:

>1. The request comes directly from the client.
This is indicated by a <dispatcher>element with value REQUEST, or by the 
absence of any <dispatcher>elements.

>2. The request is being processed under a request dispatcher representing the Web 
component matching the <url-pattern>or <servlet-name>using a 
forward()call.
This is indicated by a <dispatcher>element with value FORWARD.

`<dispather>` is not added to struts filter mapping. That means struts won't handle any request forwarded internally. Solution is as below.

```xml

<filter-mapping>
    <filter-name>struts2</filter-name>
    <url-pattern>/action_need_forward.action</url-pattern>
    <dispatcher>FORWARD</dispatcher>
</filter-mapping>

```

If those actions are only internally avaiable, they can be protected in spring authenticate config.



