# Data sources

Where bank and card facts come from, and which sites need care when fetching them.

## Bank lists

- The State Bank of Vietnam (SBV) publishes quarterly lists of licensed credit institutions:
  [joint-stock banks](https://sbv.gov.vn/vi/nhtm-c%E1%BB%95-ph%E1%BA%A7n),
  [100% foreign-owned banks](https://sbv.gov.vn/vi/ng%C3%A2n-h%C3%A0ng-100-v%E1%BB%91n-n%C6%B0%E1%BB%9Bc-ngo%C3%A0i),
  [joint-venture banks](https://sbv.gov.vn/vi/ng%C3%A2n-h%C3%A0ng-li%C3%AAn-doanh) and
  [foreign bank branches](https://sbv.gov.vn/vi/chi-nh%C3%A1nh-ng%C3%A2n-h%C3%A0ng-n%C6%B0%E1%BB%9Bc-ngo%C3%A0i).
  The state-owned list holds only Agribank; SBV files Vietcombank, VietinBank and BIDV under
  joint-stock. Use the SBV name as a bank's `name`.
- SBV's site rejects automated clients on and off ("Request Rejected" or a JavaScript challenge).
  Read the list pages in a browser when that happens.
- SBV publishes no per-bank credit card counts. Press articles that repeat the banks' own claims
  are the only source, so treat them as rough popularity evidence, not market share.

## Bank sites that resist fetching

- MB (`mbbank.com.vn` and its file host `webcdn.mbbank.com.vn`) returns 403 to `curl` but loads
  in a real browser; fetch its PDFs from inside a loaded page.
- SHB (`shb.com.vn`) shows a security check even in a browser; it is left out of the data until
  its pages can be read.
- VIB (`vib.com.vn`) serves a JavaScript challenge to `curl` and 403 to headless browsers on its
  card, fee and loan pages, often after the first page or two. Its savings page loads rates from a
  separate service that also returns 403. A real browser reads the pages: the VIB cards were read
  in Orca's built-in browser.
- Vietcombank refuses headless Chrome, but `curl` reads its pages and PDFs. BIDV and MB need a
  browser. TPBank's firewall blocks headless Chrome and resets bursts of `curl`; spaced requests work.
- Some fee schedules are image-only PDFs or PNGs (Standard Chartered, MSB, parts of MB and ACB).
  Render them (`pdftoppm -r 90 -png`) and read the image rather than trusting text extraction,
  which can misplace table columns.
- Fee schedule PDFs change URL with every update, so `feeScheduleUrl` points at the bank's fee
  landing page where one exists. LPBank's PDF links carry file ids that change too.

## Pages built by JavaScript

`curl` gets an empty shell or partial page from these; read them in a browser, or call the data
feed the page itself loads:

- Agribank's product and rate pages (its fee PDFs fetch fine).
- Cake's rate table and HDBank's HTML pages (HDBank's PDFs on `cdn.hdbank.com.vn` fetch fine).
- Sacombank's fee page loads each schedule's table on click; Techcombank's rate page builds its
  PDF list in the browser.
- SeABank and TPBank product pages load their tabs separately: SeABank's "Lợi ích" and
  "Điều kiện" text appears only after a click, and TPBank's tabs can be fetched through
  `/wps/wcm/connect`.
- BIDV's rate page loads its tables from a POST data feed, Vietcombank's from
  `/vi-VN/api/interestrates`, and MSB embeds its rates as JSON in the page.

## Other quirks

- SeABank's card fee PDF has a text layer that merges table cells; read the rendered image.
- OCB serves its PDFs from `webocb-api.ocb.com.vn` and Standard Chartered from `av.sc.com`, both
  the banks' own hosts.
- Standard Chartered's auto-loan page still sits in its menu but returns 404.
