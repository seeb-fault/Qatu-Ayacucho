# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 4 |
| Low | 2 |
| Informational | 4 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded Low |  | Percentage of memory used | 94    |
| Medium | Exceeded High |  | Percentage of network failures | 75 % |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 5,576    |
| Low | Exceeded High | http://host.docker.internal:3100 | Percentage of slow responses | 95 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 2xx | 87 % |
| Info | Exceeded Low | http://host.docker.internal:3100 | Percentage of responses with status code 4xx | 11 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 5xx | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type application/javascript | 21 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type font/woff2 | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/jpeg | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/svg+xml | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/css | 7 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/html | 68 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method GET | 98 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method POST | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Count of total endpoints | 123    |
| Info | Informational | https://host.docker.internal:3100 | Percentage of endpoints with method GET | 100 % |
| Info | Informational | https://host.docker.internal:3100 | Count of total endpoints | 1    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Absence of Anti-CSRF Tokens | Medium | 4 |
| CSP: script-src unsafe-inline | Medium | 5 |
| CSP: style-src unsafe-inline | Medium | 5 |
| HTTP Only Site | Medium | 1 |
| Cross-Origin-Embedder-Policy Header Missing or Invalid | Low | Systemic |
| Cross-Origin-Opener-Policy Header Missing or Invalid | Low | Systemic |
| Authentication Request Identified | Informational | 2 |
| Cookie Slack Detector | Informational | Systemic |
| Non-Storable Content | Informational | Systemic |
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

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
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
* URL: http://host.docker.internal:3100/lista
  * Node Name: `http://host.docker.internal:3100/lista`
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


Instances: 5

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

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
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
* URL: http://host.docker.internal:3100/lista
  * Node Name: `http://host.docker.internal:3100/lista`
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


Instances: 5

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

### [ HTTP Only Site ](https://www.zaproxy.org/docs/alerts/10106/)



##### Medium (Medium)

### Description

The site is only served under HTTP and not HTTPS.

* URL: http://host.docker.internal:3100/%3Fq
  * Node Name: `https://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Failed to connect.
ZAP attempted to connect via: https://host.docker.internal:3100/`


Instances: 1

### Solution

Configure your web or application server to use SSL (https).

### Reference


* [ https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html ](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
* [ https://letsencrypt.org/ ](https://letsencrypt.org/)


#### CWE Id: [ 311 ](https://cwe.mitre.org/data/definitions/311.html)


#### WASC Id: 4

#### Source ID: 1

### [ Cross-Origin-Embedder-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Embedder-Policy header is a response header that prevents a document from loading any cross-origin resources that don't explicitly grant the document permission (using CORP or CORS).

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/buscar%3Ftipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (tipo)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/cuenta
  * Node Name: `http://host.docker.internal:3100/cuenta`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/lista
  * Node Name: `http://host.docker.internal:3100/lista`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that the application/web server sets the Cross-Origin-Embedder-Policy header appropriately, and that it sets the Cross-Origin-Embedder-Policy header to 'require-corp' for documents.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Embedder-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-embedder-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Cross-Origin-Opener-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Opener-Policy header is a response header that allows a site to control if others included documents share the same browsing context. Sharing the same browsing context with untrusted documents might lead to data leak.

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``
* URL: http://host.docker.internal:3100/buscar%3Ftipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (tipo)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``
* URL: http://host.docker.internal:3100/cuenta
  * Node Name: `http://host.docker.internal:3100/cuenta`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``
* URL: http://host.docker.internal:3100/lista
  * Node Name: `http://host.docker.internal:3100/lista`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that the application/web server sets the Cross-Origin-Opener-Policy header appropriately, and that it sets the Cross-Origin-Opener-Policy header to 'same-origin' for documents.
'same-origin-allow-popups' is considered as less secured and should be avoided.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Opener-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-opener-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

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

### [ Cookie Slack Detector ](https://www.zaproxy.org/docs/alerts/90027/)



##### Informational (Low)

### Description

Repeated GET requests: drop a different cookie each time, followed by normal request with all cookies to stabilize session, compare responses against original baseline GET. This can reveal areas where cookie based authentication/attributes are not actually enforced.

* URL: http://host.docker.internal:3100/_next/static/chunks/040mcritlvdqn.css
  * Node Name: `http://host.docker.internal:3100/_next/static/chunks/040mcritlvdqn.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/_next/static/chunks/0cz1d0mv5g_q7.js
  * Node Name: `http://host.docker.internal:3100/_next/static/chunks/0cz1d0mv5g_q7.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/_next/static/chunks/0lzhf42n_dqg8.js
  * Node Name: `http://host.docker.internal:3100/_next/static/chunks/0lzhf42n_dqg8.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/ingresar
  * Node Name: `http://host.docker.internal:3100/ingresar ()(email,password)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/registro
  * Node Name: `http://host.docker.internal:3100/registro ()(email,nombre,password)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`

Instances: Systemic


### Solution



### Reference


* [ https://cwe.mitre.org/data/definitions/205.html ](https://cwe.mitre.org/data/definitions/205.html)


#### CWE Id: [ 205 ](https://cwe.mitre.org/data/definitions/205.html)


#### WASC Id: 45

#### Source ID: 1

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/cuenta
  * Node Name: `http://host.docker.internal:3100/cuenta`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/lista
  * Node Name: `http://host.docker.internal:3100/lista`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/robots.txt
  * Node Name: `http://host.docker.internal:3100/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ User Controllable HTML Element Attribute (Potential XSS) ](https://www.zaproxy.org/docs/alerts/10031/)



##### Informational (Low)

### Description

This check looks at user-supplied input in query string parameters and POST data to identify where certain HTML attribute values might be controlled. This provides hot-spot detection for XSS (cross-site scripting) that will require further review by a security analyst to determine exploitability.

* URL: http://host.docker.internal:3100/buscar%3Fcategoria=jardineria&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `categoria`
  * Attack: ``
  * Evidence: ``
  * Other Info: `User-controlled HTML attribute values were found. Try injecting special characters to see if XSS might be possible. The page at the following URL:

http://host.docker.internal:3100/buscar?categoria=jardineria&tipo=herramienta

appears to include user input in:
a(n) [option] tag [value] attribute

The user input found was:
categoria=jardineria

The user-controlled value was:
jardineria`
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


