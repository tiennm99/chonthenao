# Chọn Thẻ Nào

Trang tĩnh giúp người dùng tại Việt Nam so sánh thẻ tín dụng và chọn thẻ, ngân hàng hợp với cách
mình chi tiêu. Mỗi con số đều kèm link nguồn của ngân hàng và ngày kiểm tra gần nhất.

> **Miễn trừ trách nhiệm:** thông tin trên trang chỉ mang tính chất tham khảo, có thể đã cũ hoặc
> chưa chính xác. Hãy tự kiểm tra lại với ngân hàng trước khi đăng ký. Đây không phải lời khuyên
> tài chính.

Live: <https://chonthenao.pages.dev/> (Cloudflare Pages) and
<https://tiennm99.github.io/chonthenao/> (GitHub Pages).

## Quick start

Needs Node 24 and npm.

```sh
npm install
npm run dev
```

Before pushing: `npm run lint && npm run format:check && npm run check && npm test && npm run validate-data`.
Browser tests run on the built site: `npm run build && npm run e2e` (needs `npx playwright install chromium`
once, or `PW_CHANNEL=chrome` to use an installed Chrome).

`npm run build` writes a static site to `build/` (`@sveltejs/adapter-static`). Cloudflare Pages
serves it from the root; the GitHub Pages workflow builds it under `/chonthenao`.

More: [docs/data.md](docs/data.md) explains the data files, [docs/data-sources.md](docs/data-sources.md) where the data comes from, [docs/questionnaire.md](docs/questionnaire.md) how suggestions are scored.

## License

[Apache-2.0](LICENSE)
