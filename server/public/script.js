// server/public/script.js

// --------------------------------------------
// 1) 전역 변수 선언
// --------------------------------------------
let authToken = null;
let currentUsername = null;
let currentCommentSongId = null; // 댓글창 열 때 현재 노래 ID 저장

// DOM 요소들
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileSection = document.getElementById('profileSection');
const headerControls = document.getElementById('headerControls');
const profileName = document.getElementById('profileName');

const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');
const loginSubmit = document.getElementById('loginSubmit');
const signupSubmit = document.getElementById('signupSubmit');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupUsername = document.getElementById('signupUsername');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');

const generateSection = document.getElementById('generateSection');
const promptInput = document.getElementById('promptInput');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');

const generateBtn = document.getElementById('generateBtn');
const resultsDiv = document.getElementById('results');
const lyricsBox = document.getElementById('lyrics');
const melodyBox = document.getElementById('melody');
const saveSongBtn = document.getElementById('saveSongBtn');
const saveMessage = document.getElementById('saveMessage');

const mySongsSection = document.getElementById('mySongsSection');
const songList = document.getElementById('songList');
const allSongsSection = document.getElementById('allSongsSection');
const allSongList = document.getElementById('allSongList');

const commentModal = document.getElementById('commentModal');
const closeComment = document.getElementById('closeComment');
const commentList = document.getElementById('commentList');
const commentInput = document.getElementById('commentInput');
const commentSubmit = document.getElementById('commentSubmit');
const commentMessage = document.getElementById('commentMessage');

// 옵션 버튼들
const mandatoryOptions = document.querySelectorAll('.mandatory-options .option-btn');
const categoryOptions = document.querySelectorAll('.category-options .option-btn');
const subOptionsContainer = document.getElementById('subOptions');
const sheetOption = document.getElementById('sheetOption');

// --------------------------------------------
// 2) 페이지 초기화
// --------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    // 로그인 상태가 아니라면, 로그인/회원가입 버튼만 보여주기
    showLoggedOutUI();

    // 드롭존 이벤트
    setupDragDrop();

    // 옵션 버튼 이벤트 설정
    mandatoryOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            mandatoryOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    categoryOptions.forEach(btn => {
        btn.addEventListener('click', () => toggleCategory(btn));
    });

    // 모달 열기/닫기
    loginBtn.addEventListener('click', () => toggleModal(loginModal, true));
    signupBtn.addEventListener('click', () => toggleModal(signupModal, true));
    closeLogin.addEventListener('click', () => toggleModal(loginModal, false));
    closeSignup.addEventListener('click', () => toggleModal(signupModal, false));
    closeComment.addEventListener('click', () => toggleModal(commentModal, false));
});

// --------------------------------------------
// 3) 모달 표시/숨김 함수
// --------------------------------------------
function toggleModal(modalEl, show) {
    if (show) {
        modalEl.classList.remove('hidden');
    } else {
        modalEl.classList.add('hidden');
    }
}

// --------------------------------------------
// 4) 로그인/회원가입/로그아웃 로직
// --------------------------------------------
async function signup() {
    signupMessage.textContent = '';
    const data = {
        email: signupEmail.value.trim(),
        password: signupPassword.value.trim(),
        username: signupUsername.value.trim()
    };
    if (!data.email || !data.password || !data.username) {
        return signupMessage.textContent = '모든 필드를 입력해주세요.';
    }
    try {
        const res = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) {
            signupMessage.textContent = json.error;
        } else {
            // 회원가입 성공 시 로그인 모달로 전환
            toggleModal(signupModal, false);
            toggleModal(loginModal, true);
            signupEmail.value = signupPassword.value = signupUsername.value = '';
            signupMessage.textContent = '';
        }
    } catch (err) {
        signupMessage.textContent = '네트워크 오류, 나중에 다시 시도하세요.';
    }
}

async function login() {
    loginMessage.textContent = '';
    const data = {
        email: loginEmail.value.trim(),
        password: loginPassword.value.trim()
    };
    if (!data.email || !data.password) {
        return loginMessage.textContent = '이메일과 비밀번호를 입력해주세요.';
    }
    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) {
            loginMessage.textContent = json.error;
        } else {
            // 로그인 성공
            authToken = json.token;
            currentUsername = json.username;
            loginEmail.value = loginPassword.value = '';
            loginMessage.textContent = '';
            toggleModal(loginModal, false);
            showLoggedInUI();
            loadMySongs();
            loadAllSongs();
        }
    } catch (err) {
        loginMessage.textContent = '네트워크 오류, 나중에 다시 시도하세요.';
    }
}

function logout() {
    authToken = null;
    currentUsername = null;
    showLoggedOutUI();
}

// UI: 로그인 전
function showLoggedOutUI() {
    headerControls.classList.remove('hidden');
    profileSection.classList.add('hidden');
    generateSection.classList.add('hidden');
    mySongsSection.classList.add('hidden');
    allSongsSection.classList.add('hidden');
}

// UI: 로그인 후
function showLoggedInUI() {
    headerControls.classList.add('hidden');
    profileSection.classList.remove('hidden');
    profileName.textContent = `안녕하세요, ${currentUsername}님`;
    generateSection.classList.remove('hidden');
    mySongsSection.classList.remove('hidden');
    allSongsSection.classList.remove('hidden');
}
logoutBtn.addEventListener('click', logout);
loginSubmit.addEventListener('click', login);
signupSubmit.addEventListener('click', signup);

// --------------------------------------------
// 5) 드래그 & 드롭(이미지 업로드) 설정
// --------------------------------------------
function setupDragDrop() {
    dropZone.addEventListener('click', () => imageInput.click());

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    imageInput.addEventListener('change', () => {
        if (imageInput.files.length) {
            handleFiles(imageInput.files);
        }
    });
}
function handleFiles(files) {
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        return alert('이미지 파일만 업로드 가능합니다.');
    }
    const reader = new FileReader();
    reader.onload = e => {
        dropZone.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" style="max-height:80px; max-width:100%; border-radius:6px;" />`;
    };
    reader.readAsDataURL(file);
}

// --------------------------------------------
// 6) 옵션 선택 관련 함수
// --------------------------------------------
function toggleCategory(btn) {
    const cat = btn.dataset.cat;
    const isActive = btn.classList.toggle('active');
    if (!isActive) {
        subOptionsContainer.innerHTML = '';
        return;
    }
    // 나머지 카테고리버튼 비활성화
    categoryOptions.forEach(b => { if (b !== btn) b.classList.remove('active') });

    let opts = [];
    if (cat === 'genre') {
        opts = ['🎵 장르', '팝', '재즈', '클래식', '힙합', '일렉트로닉'];
    } else if (cat === 'mood') {
        opts = ['🎵 분위기', '활기찬', '슬픈', '로맨틱', '잔잔한'];
    } else if (cat === 'activity') {
        opts = ['🎵 활동', '집중', '러닝', '휴식', '공부', '여행'];
    }
    subOptionsContainer.innerHTML = opts
        .map((o, i) => `<span class="sub-option" style="${i === 0 ? 'font-weight:bold' : ''}">${o}</span>`)
        .join('');
}

// --------------------------------------------
// 7) AI 생성 (가사·멜로디) + 저장
// --------------------------------------------
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return alert('프롬프트를 입력하세요.');

    // 결과 초기화
    lyricsBox.textContent = '가사 생성 중...';
    melodyBox.textContent = '멜로디 생성 중...';
    resultsDiv.classList.remove('hidden');

    const type = document.querySelector('.mandatory-options .active').dataset.type;
    const calls = [];

    if (type === 'both' || type === 'lyrics') {
        calls.push(
            fetch('/generate-lyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
                .then(res => res.json())
                .then(json => {
                    if (json.error) lyricsBox.textContent = json.error;
                    else lyricsBox.textContent = json.lyrics;
                })
        );
    } else {
        lyricsBox.textContent = '선택되지 않음';
    }

    if (type === 'both' || type === 'melody') {
        calls.push(
            fetch('/generate-melody', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
                .then(res => res.json())
                .then(json => {
                    if (json.error) melodyBox.textContent = json.error;
                    else melodyBox.textContent = json.melody;
                })
        );
    } else {
        melodyBox.textContent = '선택되지 않음';
    }

    await Promise.all(calls);
    // → 이후 “저장하기” 버튼을 누르면 노래 저장
});

saveSongBtn.addEventListener('click', async () => {
    saveMessage.textContent = '';
    const data = {
        prompt: promptInput.value.trim(),
        lyrics: lyricsBox.textContent,
        audio_url: null,
        style: null
    };

    if (!data.prompt) {
        return saveMessage.textContent = '프롬프트가 없습니다.';
    }

    try {
        const res = await fetch('/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) {
            saveMessage.textContent = json.error;
        } else {
            saveMessage.textContent = json.message;
            promptInput.value = '';
            lyricsBox.textContent = '';
            melodyBox.textContent = '';
            resultsDiv.classList.add('hidden');
            loadMySongs();
            loadAllSongs();
        }
    } catch (err) {
        saveMessage.textContent = '네트워크 오류, 저장 실패';
    }
});

// --------------------------------------------
// 8) 내 노래 / 공개 노래 목록 불러오기
// --------------------------------------------
async function loadMySongs() {
    songList.innerHTML = '';
    try {
        const res = await fetch('/my-songs', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const arr = await res.json();
        if (Array.isArray(arr)) {
            arr.forEach(song => {
                const li = document.createElement('li');
                li.classList.add('song-item');

                // 왼쪽: “[시간] 프롬프트”
                const leftDiv = document.createElement('div');
                leftDiv.classList.add('song-item-left');
                leftDiv.textContent = `[${new Date(song.created_at).toLocaleString()}] ${song.prompt}`;

                // 오른쪽: ★ 좋아요, 💬 댓글
                const rightDiv = document.createElement('div');
                rightDiv.classList.add('song-item-right');

                const favBtn = document.createElement('button');
                favBtn.innerHTML = '★';
                favBtn.classList.add('favorite-btn');
                favBtn.addEventListener('click', () => toggleFavorite(song.id, favBtn));

                const commentBtn = document.createElement('button');
                commentBtn.innerHTML = '💬';
                commentBtn.classList.add('comment-btn');
                commentBtn.addEventListener('click', () => openCommentModal(song.id));

                rightDiv.append(favBtn, commentBtn);
                li.append(leftDiv, rightDiv);
                songList.appendChild(li);
            });
            // 내 좋아요 상태 표시
            updateMyFavoritesUI();
        }
    } catch (err) {
        console.error('내 노래 목록 불러오기 실패:', err);
    }
}

async function loadAllSongs() {
    allSongList.innerHTML = '';
    try {
        const res = await fetch('/songs');
        const arr = await res.json();
        if (Array.isArray(arr)) {
            arr.forEach(song => {
                const li = document.createElement('li');
                li.classList.add('song-item');

                const leftDiv = document.createElement('div');
                leftDiv.classList.add('song-item-left');
                leftDiv.textContent = `[${new Date(song.created_at).toLocaleString()}] ${song.username}님의 “${song.prompt}”`;

                const rightDiv = document.createElement('div');
                rightDiv.classList.add('song-item-right');

                const favBtn = document.createElement('button');
                favBtn.innerHTML = '★';
                favBtn.classList.add('favorite-btn');
                favBtn.dataset.songId = song.id;
                favBtn.addEventListener('click', () => toggleFavorite(song.id, favBtn));

                const commentBtn = document.createElement('button');
                commentBtn.innerHTML = '💬';
                commentBtn.classList.add('comment-btn');
                commentBtn.addEventListener('click', () => openCommentModal(song.id));

                rightDiv.append(favBtn, commentBtn);
                li.append(leftDiv, rightDiv);
                allSongList.appendChild(li);
            });
            updateMyFavoritesUI();
        }
    } catch (err) {
        console.error('공개 노래 목록 불러오기 실패:', err);
    }
}

// --------------------------------------------
// 9) 좋아요(토글) - 클릭 시 추가/삭제
// --------------------------------------------
async function toggleFavorite(songId, buttonEl) {
    if (!authToken) {
        return alert('로그인 후 이용 가능합니다.');
    }
    // 버튼에 'liked' 클래스가 있으면 → 삭제 요청, 없으면 → 추가 요청
    const isLiked = buttonEl.classList.contains('liked');
    if (!isLiked) {
        // 좋아요 추가
        try {
            const res = await fetch('/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ song_id: songId })
            });
            const json = await res.json();
            if (json.error) {
                console.error(json.error);
                return;
            }
            buttonEl.classList.add('liked');
        } catch (err) {
            console.error('좋아요 추가 실패:', err);
        }
    } else {
        // 좋아요 취소
        try {
            const res = await fetch(`/favorites/${songId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + authToken }
            });
            const json = await res.json();
            if (json.error) {
                console.error(json.error);
                return;
            }
            buttonEl.classList.remove('liked');
        } catch (err) {
            console.error('좋아요 취소 실패:', err);
        }
    }
}

// 내 좋아요 데이터 불러와서 UI 업데이트
async function updateMyFavoritesUI() {
    if (!authToken) return;
    try {
        const res = await fetch('/favorites/my', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const favoritedIds = await res.json(); // [1, 2, 5, ...]
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const sid = parseInt(btn.dataset.songId);
            if (favoritedIds.includes(sid)) {
                btn.classList.add('liked');
            } else {
                btn.classList.remove('liked');
            }
        });
    } catch (err) {
        console.error('내 좋아요 상태 업데이트 실패:', err);
    }
}

// --------------------------------------------
// 10) 댓글 모달 열기 / 닫기 / 댓글 불러오기 / 등록
// --------------------------------------------
function openCommentModal(songId) {
    commentList.innerHTML = '';
    commentInput.value = '';
    commentMessage.textContent = '';
    currentCommentSongId = songId;
    toggleModal(commentModal, true);
    loadComments(songId);
}

async function loadComments(songId) {
    try {
        const res = await fetch(`/comments/${songId}`);
        const arr = await res.json();
        commentList.innerHTML = '';
        if (Array.isArray(arr)) {
            arr.forEach(c => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${c.username}:</strong> ${c.content} <span class="comment-time">[${new Date(c.created_at).toLocaleString()}]</span>`;
                commentList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('댓글 불러오기 실패:', err);
    }
}

commentSubmit.addEventListener('click', async () => {
    commentMessage.textContent = '';
    if (!authToken) {
        return alert('로그인 후 댓글을 달 수 있습니다.');
    }
    const content = commentInput.value.trim();
    if (!content) {
        return (commentMessage.textContent = '댓글을 입력하세요.');
    }
    try {
        const res = await fetch('/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ song_id: currentCommentSongId, content })
        });
        const json = await res.json();
        if (json.error) {
            commentMessage.textContent = json.error;
        } else {
            commentInput.value = '';
            loadComments(currentCommentSongId);
        }
    } catch (err) {
        commentMessage.textContent = '댓글 등록 실패';
        console.error(err);
    }
});

// --------------------------------------------
// 11) 페이지 초기 진입 시, 로그인 상태가 남아있으면 
//     토큰 체크 or 자동으로 목록 불러오기할 수도 있지만
//     여기서는 브라우저를 닫았다 열면 재로그인이 필요합니다.
// --------------------------------------------
