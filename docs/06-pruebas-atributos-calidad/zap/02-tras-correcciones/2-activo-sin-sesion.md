# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 3 |
| Low | 0 |
| Informational | 4 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded Low |  | Percentage of memory used | 80    |
| Low | Warning |  | ZAP errors logged - see the zap.log file for details | 15    |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 36    |
| Low | Exceeded High | http://host.docker.internal:3100 | Percentage of slow responses | 87 % |
| Info | Informational |  | Percentage of network failures | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 2xx | 87 % |
| Info | Exceeded Low | http://host.docker.internal:3100 | Percentage of responses with status code 4xx | 12 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 5xx | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type application/javascript | 20 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type font/woff2 | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/jpeg | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/svg+xml | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/css | 7 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/html | 69 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method GET | 98 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method POST | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Count of total endpoints | 127    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Absence of Anti-CSRF Tokens | Medium | 4 |
| CSP: script-src unsafe-inline | Medium | Systemic |
| CSP: style-src unsafe-inline | Medium | Systemic |
| Authentication Request Identified | Informational | 2 |
| GET for POST | Informational | 2 |
| User Agent Fuzzer | Informational | Systemic |
| User Controllable HTML Element Attribute (Potential XSS) | Informational | 2 |




## Alert Detail



### [ Absence of Anti-CSRF Tokens ](https://www.zaproxy.org/docs/alerts/10202/)



##### Medium (Low)

### Description

No Anti-CSRF tokens were found in a HTML submission form.
A cross-site request forgery is an attack that involves forcing a victim to send an HTTP request to a target destination without their knowledge or intent in order to perform an action as the victim. The underlying cause is application functionality using predictable URL/form actions in a repeatable way. The nature of the attack is that CSRF exploits the trust that a web site has for a user. By contrast, cross-site scripting (XSS) exploits the trust that a user has for a web site. Like XSS, CSRF attacks are not necessarily cross-site, but they can be. Cross-site request forgery is also known as CSRF, XSRF, one-click attack, session riding, confused deputy, and sea surf.

CSRF attacks are effective in a number of situations, including:
    * The victim has an active session on the target site.
    * The victim is authenticated via HTTP auth on the target site.
    * The victim is on the same local network as the target site.

CSRF has primarily been used to perform an action against a target site using the victim's privileges, but recent techniques have been discovered to disclose information by gaining access to the response. The risk of information disclosure is dramatically increased when the target site is vulnerable to XSS, because XSS can be used as a platform for CSRF, allowing the attack to operate within the bounds of the same-origin policy.

* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<form class="v4cRrq_form" aria-busy="false" method="post">`
  * Other Info: `No known Anti-CSRF token [anticsrf, CSRFToken, __RequestVerificationToken, csrfmiddlewaretoken, authenticity_token, OWASP_CSRFTOKEN, anoncsrf, csrf_token, _csrf, _csrfSecret, __csrf_magic, CSRF, _token, _csrf_token, _csrfToken] was found in the following HTML form: [Form 1: "acceso-email" "acceso-password" ].`
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<form class="v4cRrq_form" aria-busy="false" method="post">`
  * Other Info: `No known Anti-CSRF token [anticsrf, CSRFToken, __RequestVerificationToken, csrfmiddlewaretoken, authenticity_token, OWASP_CSRFTOKEN, anoncsrf, csrf_token, _csrf, _csrfSecret, __csrf_magic, CSRF, _token, _csrf_token, _csrfToken] was found in the following HTML form: [Form 1: "acceso-email" "acceso-nombre" "acceso-password" ].`
* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar ()(email,password)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<form class="v4cRrq_form" aria-busy="false" method="post">`
  * Other Info: `No known Anti-CSRF token [anticsrf, CSRFToken, __RequestVerificationToken, csrfmiddlewaretoken, authenticity_token, OWASP_CSRFTOKEN, anoncsrf, csrf_token, _csrf, _csrfSecret, __csrf_magic, CSRF, _token, _csrf_token, _csrfToken] was found in the following HTML form: [Form 1: "acceso-email" "acceso-password" ].`
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro ()(email,nombre,password)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<form class="v4cRrq_form" aria-busy="false" method="post">`
  * Other Info: `No known Anti-CSRF token [anticsrf, CSRFToken, __RequestVerificationToken, csrfmiddlewaretoken, authenticity_token, OWASP_CSRFTOKEN, anoncsrf, csrf_token, _csrf, _csrfSecret, __csrf_magic, CSRF, _token, _csrf_token, _csrfToken] was found in the following HTML form: [Form 1: "acceso-email" "acceso-nombre" "acceso-password" ].`


Instances: 4

### Solution

Phase: Architecture and Design
Use a vetted library or framework that does not allow this weakness to occur or provides constructs that make this weakness easier to avoid.
For example, use anti-CSRF packages such as the OWASP CSRFGuard.

Phase: Implementation
Ensure that your application is free of cross-site scripting issues, because most CSRF defenses can be bypassed using attacker-controlled script.

Phase: Architecture and Design
Generate a unique nonce for each form, place the nonce into the form, and verify the nonce upon receipt of the form. Be sure that the nonce is not predictable (CWE-330).
Note that this can be bypassed using XSS.

Identify especially dangerous operations. When the user performs a dangerous operation, send a separate confirmation request to ensure that the user intended to perform that operation.
Note that this can be bypassed using XSS.

Use the ESAPI Session Management control.
This control includes a component for CSRF.

Do not use the GET method for any request that triggers a state change.

Phase: Implementation
Check the HTTP Referer header to see if the request originated from an expected page. This could break legitimate functionality, because users or proxies may have disabled sending the Referer for privacy reasons.

### Reference


* [ https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html ](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
* [ https://cwe.mitre.org/data/definitions/352.html ](https://cwe.mitre.org/data/definitions/352.html)


#### CWE Id: [ 352 ](https://cwe.mitre.org/data/definitions/352.html)


#### WASC Id: 9

#### Source ID: 3

### [ CSP: script-src unsafe-inline ](https://www.zaproxy.org/docs/alerts/10055/)



##### Medium (High)

### Description

Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks. Including (but not limited to) Cross Site Scripting (XSS), and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page — covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.

* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/buscar%3Ftipo=servicio
  * Node Name: `http://host.docker.internal:3100/buscar (tipo)`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/cuenta
  * Node Name: `http://host.docker.internal:3100/cuenta`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/robots.txt
  * Node Name: `http://host.docker.internal:3100/robots.txt`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/sitemap.xml
  * Node Name: `http://host.docker.internal:3100/sitemap.xml`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is properly configured to set the Content-Security-Policy header.

### Reference


* [ https://www.w3.org/TR/CSP/ ](https://www.w3.org/TR/CSP/)
* [ https://caniuse.com/#search=content+security+policy ](https://caniuse.com/#search=content+security+policy)
* [ https://content-security-policy.com/ ](https://content-security-policy.com/)
* [ https://github.com/HtmlUnit/htmlunit-csp ](https://github.com/HtmlUnit/htmlunit-csp)
* [ https://web.dev/articles/csp#resource-options ](https://web.dev/articles/csp#resource-options)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ CSP: style-src unsafe-inline ](https://www.zaproxy.org/docs/alerts/10055/)



##### Medium (High)

### Description

Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks. Including (but not limited to) Cross Site Scripting (XSS), and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page — covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.

* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/buscar%3Ftipo=servicio
  * Node Name: `http://host.docker.internal:3100/buscar (tipo)`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/cuenta
  * Node Name: `http://host.docker.internal:3100/cuenta`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/robots.txt
  * Node Name: `http://host.docker.internal:3100/robots.txt`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/sitemap.xml
  * Node Name: `http://host.docker.internal:3100/sitemap.xml`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is properly configured to set the Content-Security-Policy header.

### Reference


* [ https://www.w3.org/TR/CSP/ ](https://www.w3.org/TR/CSP/)
* [ https://caniuse.com/#search=content+security+policy ](https://caniuse.com/#search=content+security+policy)
* [ https://content-security-policy.com/ ](https://content-security-policy.com/)
* [ https://github.com/HtmlUnit/htmlunit-csp ](https://github.com/HtmlUnit/htmlunit-csp)
* [ https://web.dev/articles/csp#resource-options ](https://web.dev/articles/csp#resource-options)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (Low)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar ()(email,password)`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password
referer=http://host.docker.internal:3100/ingresar`
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro ()(email,nombre,password)`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password
referer=http://host.docker.internal:3100/registro`


Instances: 2

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ GET for POST ](https://www.zaproxy.org/docs/alerts/10058/)



##### Informational (High)

### Description

A request that was originally observed as a POST was also accepted as a GET. This issue does not represent a security weakness unto itself, however, it may facilitate simplification of other attacks. For example if the original POST is subject to Cross-Site Scripting (XSS), then this finding may indicate that a simplified (GET based) XSS may also be possible.

* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar (email,password)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `GET http://host.docker.internal:3100/ingresar?email=zaproxy@example.com&password=ZAP HTTP/1.1`
  * Other Info: ``
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro (email,nombre,password)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `GET http://host.docker.internal:3100/registro?email=zaproxy@example.com&nombre=ZAP&password=ZAP HTTP/1.1`
  * Other Info: ``


Instances: 2

### Solution

Ensure that only POST is accepted where POST is expected.

### Reference



#### CWE Id: [ 16 ](https://cwe.mitre.org/data/definitions/16.html)


#### WASC Id: 20

#### Source ID: 1

### [ User Agent Fuzzer ](https://www.zaproxy.org/docs/alerts/10104/)



##### Informational (Medium)

### Description

Check for differences in response based on fuzzed User Agent (eg. mobile sites, access as a Search Engine Crawler). Compares the response statuscode and the hashcode of the response body with the original response.

* URL: http://host.docker.internal:3100/%3Fq
  * Node Name: `http://host.docker.internal:3100/ (q)`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/_next
  * Node Name: `http://host.docker.internal:3100/_next`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/_next/static
  * Node Name: `http://host.docker.internal:3100/_next/static`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar ()(email,password)`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro ()(email,nombre,password)`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution



### Reference


* [ https://owasp.org/www-project-web-security-testing-guide/ ](https://owasp.org/www-project-web-security-testing-guide/)



#### Source ID: 1

### [ User Controllable HTML Element Attribute (Potential XSS) ](https://www.zaproxy.org/docs/alerts/10031/)



##### Informational (Low)

### Description

This check looks at user-supplied input in query string parameters and POST data to identify where certain HTML attribute values might be controlled. This provides hot-spot detection for XSS (cross-site scripting) that will require further review by a security analyst to determine exploitability.

* URL: http://host.docker.internal:3100/buscar%3Fcategoria=perforacion&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `categoria`
  * Attack: ``
  * Evidence: ``
  * Other Info: `User-controlled HTML attribute values were found. Try injecting special characters to see if XSS might be possible. The page at the following URL:

http://host.docker.internal:3100/buscar?categoria=perforacion&tipo=herramienta

appears to include user input in:
a(n) [option] tag [value] attribute

The user input found was:
categoria=perforacion

The user-controlled value was:
perforacion`
* URL: http://host.docker.internal:3100/publicaciones/5d099151-aa8f-43f2-a413-97ed7c1bc0e4%3Fvolver=%252Fbuscar
  * Node Name: `http://host.docker.internal:3100/publicaciones/5d099151-aa8f-43f2-a413-97ed7c1bc0e4 (volver)`
  * Method: `GET`
  * Parameter: `volver`
  * Attack: ``
  * Evidence: ``
  * Other Info: `User-controlled HTML attribute values were found. Try injecting special characters to see if XSS might be possible. The page at the following URL:

http://host.docker.internal:3100/publicaciones/5d099151-aa8f-43f2-a413-97ed7c1bc0e4?volver=%2Fbuscar

appears to include user input in:
a(n) [a] tag [href] attribute

The user input found was:
volver=/buscar

The user-controlled value was:
/buscar?tipo=herramienta`


Instances: 2

### Solution

Validate all input and sanitize output it before writing to any HTML attributes.

### Reference


* [ https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html ](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)


#### CWE Id: [ 20 ](https://cwe.mitre.org/data/definitions/20.html)


#### WASC Id: 20

#### Source ID: 3


