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

Cloudflare Pages builds with its default SvelteKit preset; the GitHub Pages workflow builds a
static copy with `SITE_TARGET=github-pages`.

More: [docs/data.md](docs/data.md) explains the data files, [docs/data-sources.md](docs/data-sources.md) where the data comes from.

## License

[Apache-2.0](LICENSE)
