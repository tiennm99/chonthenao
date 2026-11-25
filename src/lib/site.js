/** Site-wide constants shared by the layout and pages. */
export const SITE_NAME = 'Chọn Thẻ Nào';
export const REPO_URL = 'https://github.com/tiennm99/chonthenao';
export const ISSUES_NEW_URL = `${REPO_URL}/issues/new`;

/** Shown in the first-visit banner and the footer of every page. */
export const DISCLAIMER =
  'Thông tin trên trang chỉ mang tính chất tham khảo, có thể đã cũ hoặc chưa chính xác. ' +
  'Hãy tự kiểm tra lại với ngân hàng trước khi đăng ký. Đây không phải lời khuyên tài chính.';

/** Shown next to every suggestion the site makes. */
export const SUGGESTION_DISCLAIMER =
  'Gợi ý chỉ là ước tính sơ bộ từ dữ liệu công khai, có thể đã cũ. ' +
  'Bạn cần tự xác nhận lại phí, ưu đãi và điều kiện với ngân hàng.';

/** Shown wherever a referral link appears. */
export const REFERRAL_NOTE =
  'Link giới thiệu: trang có thể nhận quà giới thiệu khi bạn đăng ký qua link này. ' +
  'Link giới thiệu không ảnh hưởng đến thứ tự gợi ý; bạn luôn có thể dùng link chính thức.';

/**
 * A link that opens a new GitHub issue prefilled for reporting wrong or outdated data.
 * @param {string} subject What the report is about, such as a card name.
 * @param {string} pageUrl The page the reader was on.
 * @returns {string}
 */
export function reportIssueUrl(subject, pageUrl) {
  const title = `Báo sai: ${subject}`;
  const body = [
    `Trang: ${pageUrl}`,
    '',
    'Thông tin nào sai hoặc đã cũ?',
    '',
    'Thông tin đúng là gì?',
    '',
    'Link nguồn chính thức của ngân hàng (nếu có):',
    '',
  ].join('\n');
  const q = new URLSearchParams({ title, body });
  return `${ISSUES_NEW_URL}?${q}`;
}
