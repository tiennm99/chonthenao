# Chọn Thẻ Nào

Trang tĩnh giúp người dùng tại Việt Nam so sánh thẻ tín dụng và chọn thẻ, ngân hàng hợp với cách
mình chi tiêu. Mỗi con số đều kèm link nguồn của ngân hàng và ngày kiểm tra gần nhất.

> **Miễn trừ trách nhiệm:** thông tin trên trang chỉ mang tính chất tham khảo, có thể đã cũ hoặc
> chưa chính xác. Hãy tự kiểm tra lại với ngân hàng trước khi đăng ký. Đây không phải lời khuyên
> tài chính.

Live: <https://chonthenao.pages.dev/> (Cloudflare Pages) and
<https://tiennm99.github.io/chonthenao/> (GitHub Pages).

- **Tìm thẻ cho tôi** (`/goi-y/`): a short questionnaire that ranks cards by estimated yearly
  value and suggests a bank, with the math shown.
- **Danh mục thẻ** (`/the/`): filter and sort every card; one page per card with its sources.
- **So sánh** (`/so-sanh/`): 2 to 3 cards side by side.
- **Ngân hàng** (`/ngan-hang/`): one page per bank with its cards and official links.

Thấy thông tin sai hoặc đã cũ? Dùng link "Báo thông tin sai hoặc đã cũ" trên trang thẻ, hoặc
[mở issue](https://github.com/tiennm99/chonthenao/issues/new).

## Quick start

Needs Node 24 and npm.

```sh
npm install
npm run dev
```

Before pushing:

```sh
npm run lint && npm run format:check && npm run check && npm test && npm run validate-data
npm run build && npm run check-disclaimer && npm run e2e
```

`npm run e2e` runs Playwright on the built site; run `npx playwright install chromium` once, or set
`PW_CHANNEL=chrome` to use an installed Chrome.

## Docs

- [docs/data.md](docs/data.md): the card and bank data files and their rules.
- [docs/data-sources.md](docs/data-sources.md): where the data comes from and which bank sites
  resist fetching.
- [docs/questionnaire.md](docs/questionnaire.md): how the questionnaire and scoring work.
- [docs/deploy.md](docs/deploy.md): Cloudflare Pages and GitHub Pages setup.
- [docs/known-issues.md](docs/known-issues.md): gaps in the data and the site.

## License

[Apache-2.0](LICENSE)
