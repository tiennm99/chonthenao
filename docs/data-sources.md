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

- MB (`mbbank.com.vn`) returns 403 to `curl` but loads in a real browser.
- SHB (`shb.com.vn`) shows a security check even in a browser; it is left out of the data until
  its pages can be read.
- VIB (`vib.com.vn`) serves a JavaScript challenge to `curl` and 403 to headless browsers on its
  card and fee pages. A real browser reads them: the VIB cards were read in Orca's built-in
  browser.
- Vietcombank refuses headless Chrome, but `curl` reads its pages and PDFs. BIDV and MB need a
  browser. TPBank's firewall blocks headless Chrome and resets bursts of `curl`; spaced requests work.
- Some fee schedules are image-only PDFs or PNGs (Standard Chartered, MSB, parts of MB and ACB).
  Render them (`pdftoppm -r 90 -png`) and read the image rather than trusting text extraction,
  which can misplace table columns.
- Fee schedule PDFs change URL with every update, so `feeScheduleUrl` points at the bank's fee
  landing page where one exists.
