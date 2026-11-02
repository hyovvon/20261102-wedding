/* ============================================
   웨딩 청첩장 자바스크립트
   - 예식 날짜 / 달력
   - 갤러리 사진 확대 팝업
   - 계좌번호 복사 + 팝업
   - 맨 위로 이동 버튼
   ============================================ */

// [설정 1] 예식 날짜 변경 시 이 값을 바꾸세요.
// HTML 화면의 날짜 문구도 함께 수정해야 합니다.
const WEDDING_DATE = new Date(2027, 4, 22); // 월은 0부터 시작: 4 = 5월

// [기능 1] 달력 만들기: 해당 월의 1일이 시작하는 요일과 마지막 날짜를 구합니다.
function buildCalendar(date) {
  const calendar = document.getElementById('calendar-days');
  if (!calendar) return;
  const year = date.getFullYear();
  const month = date.getMonth();
  const startWeekday = new Date(year, month, 1).getDay(); // 일요일 = 0
  const lastDay = new Date(year, month + 1, 0).getDate();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < startWeekday; i++) {
    const blank = document.createElement('span');
    blank.className = 'empty';
    blank.setAttribute('aria-hidden', 'true');
    fragment.appendChild(blank);
  }
  for (let day = 1; day <= lastDay; day++) {
    const cell = document.createElement('span');
    if (day === date.getDate()) {
      cell.className = 'chosen';
      cell.setAttribute('aria-label', `${day}일, 결혼식 날짜`);
      const label = document.createElement('b');
      label.textContent = day;
      cell.appendChild(label);
    } else {
      cell.textContent = day;
    }
    fragment.appendChild(cell);
  }
  calendar.replaceChildren(fragment);
}
buildCalendar(WEDDING_DATE);

// [기능 2] 갤러리 확대 모달: 사진은 원래 이미지 파일을 그대로 사용합니다.
const photoDialog = document.getElementById('photo-dialog');
const galleryButtons = [...document.querySelectorAll('.gallery-item')];
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
let currentPhoto = 0;
let photoOpener = null;

function showPhoto(index) {
  currentPhoto = (index + galleryButtons.length) % galleryButtons.length;
  const button = galleryButtons[currentPhoto];
  const picture = button.querySelector('img');
  lightboxImage.src = picture.getAttribute('src');
  lightboxImage.alt = picture.alt;
  lightboxCaption.textContent = button.dataset.caption || picture.alt;
  lightboxCounter.textContent = `${currentPhoto + 1} / ${galleryButtons.length}`;
}

galleryButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    photoOpener = button;
    showPhoto(index);
    if (!photoDialog.open) photoDialog.showModal();
  });
});

document.getElementById('previous-photo').addEventListener('click', () => showPhoto(currentPhoto - 1));
document.getElementById('next-photo').addEventListener('click', () => showPhoto(currentPhoto + 1));
photoDialog.querySelector('.lightbox-close').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('close', () => photoOpener?.focus());

// 모달의 어두운 배경 부분을 눌러도 닫히도록 설정
photoDialog.addEventListener('click', event => {
  if (event.target === photoDialog) photoDialog.close();
});
// 키보드 방향키로 사진 넘기기 (ESC는 dialog가 기본 지원)
document.addEventListener('keydown', event => {
  if (!photoDialog.open) return;
  if (event.key === 'ArrowLeft') showPhoto(currentPhoto - 1);
  if (event.key === 'ArrowRight') showPhoto(currentPhoto + 1);
});

// 스마트폰에서 좌우로 밀어 사진 넘기기
let touchStartX = null;
lightboxImage.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
lightboxImage.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 55) showPhoto(currentPhoto + (deltaX < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

// [기능 3] 계좌번호 복사: HTTPS가 아니어도 가능한 대체 복사 방법을 포함합니다.
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // 권한 거부 시 아래의 대체 복사 방식을 사용합니다.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
  textarea.remove();
  return copied;
}

const copyDialog = document.getElementById('copy-dialog');
const copyStatus = document.getElementById('copy-status');
const copyOwner = document.getElementById('copy-owner');
const copyAccount = document.getElementById('copy-account-text');
let selectedAccount = '';
let copyOpener = null;

function setCopyStatus(copied) {
  copyStatus.textContent = copied
    ? '계좌번호가 클립보드에 복사되었습니다.'
    : '자동 복사를 사용할 수 없습니다. 아래 번호를 직접 선택하여 복사해 주세요.';
}

document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', async () => {
    copyOpener = button;
    selectedAccount = button.dataset.account;
    copyOwner.textContent = `${button.dataset.owner} · ${button.dataset.bank}`;
    copyAccount.textContent = selectedAccount;
    // 클릭 직후 팝업을 표시하며, 실제 복사 결과에 따라 안내 문구가 달라집니다.
    copyStatus.textContent = '계좌번호 복사 중…';
    if (!copyDialog.open) copyDialog.showModal();
    setCopyStatus(await copyToClipboard(selectedAccount));
  });
});

document.getElementById('copy-again').addEventListener('click', async () => {
  setCopyStatus(await copyToClipboard(selectedAccount));
});
function closeCopyDialog() { if (copyDialog.open) copyDialog.close(); }
document.getElementById('copy-confirm').addEventListener('click', closeCopyDialog);
copyDialog.querySelector('.copy-close').addEventListener('click', closeCopyDialog);
copyDialog.addEventListener('click', event => {
  if (event.target === copyDialog) closeCopyDialog();
});
copyDialog.addEventListener('close', () => copyOpener?.focus());

// [기능 4] 화면을 아래로 스크롤하면 우측 하단 맨 위로 가기 버튼 표시
const toTop = document.querySelector('.to-top');
function toggleTopButton() {
  toTop.classList.toggle('visible', window.scrollY > 450);
}
window.addEventListener('scroll', toggleTopButton, { passive: true });
toggleTopButton();
