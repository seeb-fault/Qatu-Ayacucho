# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 1 |
| Medium | 4 |
| Low | 2 |
| Informational | 7 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded Low |  | Percentage of memory used | 84    |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 3,222    |
| Low | Exceeded Low |  | Percentage of network failures | 43 % |
| Low | Exceeded High | http://host.docker.internal:3100 | Percentage of slow responses | 92 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 2xx | 85 % |
| Info | Exceeded Low | http://host.docker.internal:3100 | Percentage of responses with status code 4xx | 14 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of responses with status code 5xx | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type application/javascript | 20 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type font/woff2 | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/jpeg | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type image/svg+xml | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/css | 7 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with content type text/html | 69 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method GET | 98 % |
| Info | Informational | http://host.docker.internal:3100 | Percentage of endpoints with method POST | 1 % |
| Info | Informational | http://host.docker.internal:3100 | Count of total endpoints | 126    |
| Info | Informational | https://host.docker.internal:3100 | Percentage of endpoints with method GET | 100 % |
| Info | Informational | https://host.docker.internal:3100 | Count of total endpoints | 1    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Source Code Disclosure - File Inclusion | High | 1 |
| Absence of Anti-CSRF Tokens | Medium | 4 |
| CSP: script-src unsafe-inline | Medium | Systemic |
| CSP: style-src unsafe-inline | Medium | Systemic |
| HTTP Only Site | Medium | 1 |
| Cross-Origin-Embedder-Policy Header Missing or Invalid | Low | 4 |
| Cross-Origin-Opener-Policy Header Missing or Invalid | Low | 4 |
| Authentication Request Identified | Informational | 2 |
| Cookie Slack Detector | Informational | Systemic |
| GET for POST | Informational | 2 |
| Non-Storable Content | Informational | Systemic |
| Storable and Cacheable Content | Informational | 2 |
| User Agent Fuzzer | Informational | Systemic |
| User Controllable HTML Element Attribute (Potential XSS) | Informational | 2 |




## Alert Detail



### [ Source Code Disclosure - File Inclusion ](https://www.zaproxy.org/docs/alerts/43/)



##### High (Medium)

### Description

The Path Traversal attack technique allows an attacker access to files, directories, and commands that potentially reside outside the web document root directory. An attacker may manipulate a URL in such a way that the web site will execute or reveal the contents of arbitrary files anywhere on the web server. Any device that exposes an HTTP-based interface is potentially vulnerable to Path Traversal.

Most web sites restrict user access to a specific portion of the file-system, typically called the "web document root" or "CGI root" directory. These directories contain the files intended for user access and the executable necessary to drive web application functionality. To access files or execute commands anywhere on the file-system, Path Traversal attacks will utilize the ability of special-characters sequences.

The most basic Path Traversal attack uses the "../" special-character sequence to alter the resource location requested in the URL. Although most popular web servers will prevent this technique from escaping the web document root, alternate encodings of the "../" sequence may help bypass the security filters. These method variations include valid and invalid Unicode-encoding ("..%u2216" or "..%c0%af") of the forward slash character, backslash characters ("..\") on Windows-based servers, URL encoded characters "%2e%2e%2f"), and double URL encoding ("..%255c") of the backslash character.

Even if the web server properly restricts Path Traversal attempts in the URL path, a web application itself may still be vulnerable due to improper handling of user-supplied input. This is a common problem of web applications that use template mechanisms or load static text from files. In variations of the attack, the original URL parameter value is substituted with the file name of one of the web application's dynamic scripts. Consequently, the results can reveal source code because the file is interpreted as text instead of an executable script. These techniques often employ additional special characters such as the dot (".") to reveal the listing of the current working directory, or "%00" NULL characters in order to bypass rudimentary file extension checks.

* URL: http://host.docker.internal:3100/_next/image%3Fq=75&url=%252Fimages%252Fherramientas-hero.webp&w=3840
  * Node Name: `http://host.docker.internal:3100/_next/image (q,url,w)`
  * Method: `GET`
  * Parameter: `url`
  * Attack: `/image`
  * Evidence: ``
  * Other Info: `The output for the source code filename [/image] differs sufficiently from that of the random parameter [tepezeiyslnrncdzdbvvcnxcefhdntgkyyelgv], at [61%], compared to a threshold of [75%]`


Instances: 1

### Solution

Assume all input is malicious. Use an "accept known good" input validation strategy, i.e., use an allow list of acceptable inputs that strictly conform to specifications. Reject any input that does not strictly conform to specifications, or transform it into something that does. Do not rely exclusively on looking for malicious or malformed inputs (i.e., do not rely on a deny list). However, deny lists can be useful for detecting potential attacks or determining which inputs are so malformed that they should be rejected outright.

When performing input validation, consider all potentially relevant properties, including length, type of input, the full range of acceptable values, missing or extra inputs, syntax, consistency across related fields, and conformance to business rules. As an example of business rule logic, "boat" may be syntactically valid because it only contains alphanumeric characters, but it is not valid if you are expecting colors such as "red" or "blue."

For filenames, use stringent allow lists that limit the character set to be used. If feasible, only allow a single "." character in the filename to avoid weaknesses, and exclude directory separators such as "/". Use an allow list of allowable file extensions.

Warning: if you attempt to cleanse your data, then do so that the end result is not in the form that can be dangerous. A sanitizing mechanism can remove characters such as '.' and ';' which may be required for some exploits. An attacker can try to fool the sanitizing mechanism into "cleaning" data into a dangerous form. Suppose the attacker injects a '.' inside a filename (e.g. "sensi.tiveFile") and the sanitizing mechanism removes the character resulting in the valid filename, "sensitiveFile". If the input data are now assumed to be safe, then the file may be compromised. 

Inputs should be decoded and canonicalized to the application's current internal representation before being validated. Make sure that your application does not decode the same input twice. Such errors could be used to bypass allow list schemes by introducing dangerous inputs after they have been checked.

Use a built-in path canonicalization function (such as realpath() in C) that produces the canonical version of the pathname, which effectively removes ".." sequences and symbolic links.

Run your code using the lowest privileges that are required to accomplish the necessary tasks. If possible, create isolated accounts with limited privileges that are only used for a single task. That way, a successful attack will not immediately give the attacker access to the rest of the software or its environment. For example, database applications rarely need to run as the database administrator, especially in day-to-day operations.

When the set of acceptable objects, such as filenames or URLs, is limited or known, create a mapping from a set of fixed input values (such as numeric IDs) to the actual filenames or URLs, and reject all other inputs.

Run your code in a "jail" or similar sandbox environment that enforces strict boundaries between the process and the operating system. This may effectively restrict which files can be accessed in a particular directory or which commands can be executed by your software.

OS-level examples include the Unix chroot jail, AppArmor, and SELinux. In general, managed code may provide some protection. For example, java.io.FilePermission in the Java SecurityManager allows you to specify restrictions on file operations.

This may not be a feasible solution, and it only limits the impact to the operating system; the rest of your application may still be subject to compromise.


### Reference


* [ https://owasp.org/www-community/attacks/Path_Traversal ](https://owasp.org/www-community/attacks/Path_Traversal)
* [ https://cwe.mitre.org/data/definitions/22.html ](https://cwe.mitre.org/data/definitions/22.html)


#### CWE Id: [ 541 ](https://cwe.mitre.org/data/definitions/541.html)


#### WASC Id: 33

#### Source ID: 1

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
* URL: http://host.docker.internal:3100/buscar%3Fcategoria=corte&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `script-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/publicar
  * Node Name: `http://host.docker.internal:3100/publicar`
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
* URL: http://host.docker.internal:3100/buscar%3Fcategoria=corte&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `Content-Security-Policy`
  * Attack: ``
  * Evidence: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.culqi.com; style-src 'self' 'unsafe-inline' https://*.culqi.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com; font-src 'self' data: https://*.culqi.com; connect-src 'self' https://*.culqi.com; frame-src https://*.culqi.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'`
  * Other Info: `style-src includes unsafe-inline.`
* URL: http://host.docker.internal:3100/publicar
  * Node Name: `http://host.docker.internal:3100/publicar`
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
* URL: http://host.docker.internal:3100/buscar%3Fcategoria=perforacion&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/publicar
  * Node Name: `http://host.docker.internal:3100/publicar`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 4

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
* URL: http://host.docker.internal:3100/buscar%3Fcategoria=perforacion&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``
* URL: http://host.docker.internal:3100/publicar
  * Node Name: `http://host.docker.internal:3100/publicar`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: `same-origin-allow-popups`
  * Other Info: ``


Instances: 4

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

* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/%3Fq
  * Node Name: `http://host.docker.internal:3100/ (q)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Cookies that don't have expected effects can reveal flaws in application logic. In the worst case, this can reveal where authentication via cookie token(s) is not actually enforced.
These cookies affected the response: 
These cookies did NOT affect the response: qatu_sesion
`
* URL: http://host.docker.internal:3100/_next
  * Node Name: `http://host.docker.internal:3100/_next`
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

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/buscar%3Fcategoria=corte&tipo=herramienta
  * Node Name: `http://host.docker.internal:3100/buscar (categoria,tipo)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3100/publicar
  * Node Name: `http://host.docker.internal:3100/publicar`
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
* URL: http://host.docker.internal:3100/sitemap.xml
  * Node Name: `http://host.docker.internal:3100/sitemap.xml`
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

### [ Storable and Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, and may be retrieved directly from the cache, rather than from the origin server by the caching servers, in response to similar requests from other users. If the response data is sensitive, personal or user-specific, this may result in sensitive information being leaked. In some cases, this may even result in a user gaining complete control of the session of another user, depending on the configuration of the caching components in use in their environment. This is primarily an issue where "shared" caching servers such as "proxy" caches are configured on the local network. This configuration is typically found in corporate or educational environments, for instance.

* URL: http://host.docker.internal:3100/_next/static/chunks/040mcritlvdqn.css
  * Node Name: `http://host.docker.internal:3100/_next/static/chunks/040mcritlvdqn.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=31536000`
  * Other Info: ``
* URL: http://host.docker.internal:3100/_next/static/media/fba5a26ea33df6a3-s.p.18rizl4rsrl42.woff2
  * Node Name: `http://host.docker.internal:3100/_next/static/media/fba5a26ea33df6a3-s.p.18rizl4rsrl42.woff2`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=31536000`
  * Other Info: ``


Instances: 2

### Solution

Validate that the response does not contain sensitive, personal or user-specific information. If it does, consider the use of the following HTTP response headers, to limit, or prevent the content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not store the response, and to not retrieve the response (without validation) from the cache, in response to a similar request.

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ User Agent Fuzzer ](https://www.zaproxy.org/docs/alerts/10104/)



##### Informational (Medium)

### Description

Check for differences in response based on fuzzed User Agent (eg. mobile sites, access as a Search Engine Crawler). Compares the response statuscode and the hashcode of the response body with the original response.

* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100
  * Node Name: `http://host.docker.internal:3100`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/
  * Node Name: `http://host.docker.internal:3100/`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:3100/%3Fq
  * Node Name: `http://host.docker.internal:3100/ (q)`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
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
* URL: http://host.docker.internal:3100/publicaciones/dd5a22d1-9a54-471b-b6da-192c5e809bae%3Fvolver=%252Fbuscar
  * Node Name: `http://host.docker.internal:3100/publicaciones/dd5a22d1-9a54-471b-b6da-192c5e809bae (volver)`
  * Method: `GET`
  * Parameter: `volver`
  * Attack: ``
  * Evidence: ``
  * Other Info: `User-controlled HTML attribute values were found. Try injecting special characters to see if XSS might be possible. The page at the following URL:

http://host.docker.internal:3100/publicaciones/dd5a22d1-9a54-471b-b6da-192c5e809bae?volver=%2Fbuscar

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


