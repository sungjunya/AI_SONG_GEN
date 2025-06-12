// ——————————————————————————————
// 1) 전역 변수 및 DOM 요소 참조
// ——————————————————————————————
let authToken = null;       // 로그인 성공 시 발급된 JWT 토큰
let currentUser = null;     // 로그인된 사용자명(username)
let currentSongIdForComments = null; // 댓글 모달이 열렸을 때 해당 songId

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileName = document.getElementById('profileName');

const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const commentModal = document.getElementById('commentModal');

const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');
const closeComment = document.getElementById('closeComment');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginSubmit = document.getElementById('loginSubmit');
const loginMessage = document.getElementById('loginMessage');

const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupUsername = document.getElementById('signupUsername');
const signupSubmit = document.getElementById('signupSubmit');
const signupMessage = document.getElementById('signupMessage');

const generateSection = document.getElementById('generateSection');
const mySongsSection = document.getElementById('mySongsSection');
const publicSongsSection = document.getElementById('publicSongsSection');

const mySongList = document.getElementById('mySongList');
const publicSongList = document.getElementById('publicSongList');

const promptInput = document.getElementById('promptInput');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const generateBtn = document.getElementById('generateBtn');
const saveSongBtn = document.getElementById('saveSongBtn');
const sheetOption = document.getElementById('sheetOption');
const lyricsPre = document.getElementById('lyrics');
const melodyPre = document.getElementById('melody');
const resultsDiv = document.getElementById('results');
const saveMessage = document.getElementById('saveMessage');

const commentList = document.getElementById('commentList');
const commentInput = document.getElementById('commentInput');
const commentSubmit = document.getElementById('commentSubmit');
const commentMessage = document.getElementById('commentMessage');

const mandatoryButtons = document.querySelectorAll('.mandatory-options .option-btn');
const categoryButtons = document.querySelectorAll('.category-options .option-btn');
const subOptionsDiv = document.getElementById('subOptions');

// ——————————————————————————————
// 1-1) 오디오 재생 관련 DOM 및 변수 생성
// ——————————————————————————————
const audioPlayer = document.createElement('audio');
audioPlayer.id = 'audioPlayer';
audioPlayer.style.display = 'none';
audioPlayer.controls = false; // 직접 만든 버튼으로 제어
document.body.appendChild(audioPlayer);

const audioControlsDiv = document.createElement('div');
audioControlsDiv.id = 'audioControls';
audioControlsDiv.style.display = 'none';
audioControlsDiv.style.margin = '10px 0';
audioControlsDiv.innerHTML = `
  <button id="playBtn">▶ 재생</button>
  <button id="pauseBtn" disabled>⏸ 일시정지</button>
`;
document.body.appendChild(audioControlsDiv);

const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');

playBtn.addEventListener('click', () => {
    audioPlayer.play();
    playBtn.disabled = true;
    pauseBtn.disabled = false;
});
pauseBtn.addEventListener('click', () => {
    audioPlayer.pause();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
});
audioPlayer.addEventListener('ended', () => {
    playBtn.disabled = false;
    pauseBtn.disabled = true;
});

// 오디오 소스 세팅 함수
function setAudioSource(url) {
    audioPlayer.src = url;
    audioPlayer.style.display = 'block';
    audioControlsDiv.style.display = 'block';
    playBtn.disabled = false;
    pauseBtn.disabled = true;
}

// ——————————————————————————————
// 2) 모달 열기/닫기 함수
// ——————————————————————————————
function openModal(modalElem) {
    modalElem.classList.remove('hidden');
}
function closeModal(modalElem) {
    modalElem.classList.add('hidden');
}

loginBtn.addEventListener('click', () => {
    loginMessage.textContent = '';
    loginEmail.value = '';
    loginPassword.value = '';
    openModal(loginModal);
});
signupBtn.addEventListener('click', () => {
    signupMessage.textContent = '';
    signupEmail.value = '';
    signupPassword.value = '';
    signupUsername.value = '';
    openModal(signupModal);
});
closeLogin.addEventListener('click', () => closeModal(loginModal));
closeSignup.addEventListener('click', () => closeModal(signupModal));
closeComment.addEventListener('click', () => closeModal(commentModal));
window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal(loginModal);
    if (e.target === signupModal) closeModal(signupModal);
    if (e.target === commentModal) closeModal(commentModal);
});

// ——————————————————————————————
// 3) 인증 처리 (회원가입, 로그인, 로그아웃)
// ——————————————————————————————
signupSubmit.addEventListener('click', async () => {
    signupMessage.textContent = '';
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const username = signupUsername.value.trim();
    if (!email || !password || !username) {
        signupMessage.style.color = 'red';
        signupMessage.textContent = '모든 필드를 입력하세요.';
        return;
    }
    try {
        const res = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
        });
        const data = await res.json();
        if (res.ok) {
            signupMessage.style.color = 'green';
            signupMessage.textContent = data.message || '회원가입 성공';
            setTimeout(() => { closeModal(signupModal); }, 1000);
        } else {
            signupMessage.style.color = 'red';
            signupMessage.textContent = data.error;
        }
    } catch (err) {
        console.error('회원가입 에러:', err);
        signupMessage.style.color = 'red';
        signupMessage.textContent = '회원가입 중 오류가 발생했습니다.';
    }
});

loginSubmit.addEventListener('click', async () => {
    loginMessage.textContent = '';
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
        loginMessage.style.color = 'red';
        loginMessage.textContent = '이메일과 비밀번호를 입력하세요.';
        return;
    }
    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            authToken = data.token;
            currentUser = data.username;
            profileName.textContent = `안녕하세요, 🎵${currentUser}님`;
            document.getElementById('headerControls').classList.add('hidden');
            document.getElementById('profileSection').classList.remove('hidden');
            closeModal(loginModal);
            generateSection.classList.remove('hidden');
            mySongsSection.classList.remove('hidden');
            publicSongsSection.classList.remove('hidden');
            await loadMySongs();
            await loadPublicSongs();
        } else {
            loginMessage.style.color = 'red';
            loginMessage.textContent = data.error || '로그인 실패';
        }
    } catch (err) {
        console.error('로그인 에러:', err);
        loginMessage.style.color = 'red';
        loginMessage.textContent = '로그인 중 오류가 발생했습니다.';
    }
});

logoutBtn.addEventListener('click', () => {
    authToken = null;
    currentUser = null;
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('headerControls').classList.remove('hidden');
    generateSection.classList.add('hidden');
    mySongsSection.classList.add('hidden');
    publicSongsSection.classList.add('hidden');
    mySongList.innerHTML = '';
    publicSongList.innerHTML = '';
});

// ——————————————————————————————
// 4) AI 가사·멜로디 생성 & 노래 저장 & 오디오 재생 처리
// ——————————————————————————————
dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
imageInput.addEventListener('change', () => {
    if (imageInput.files.length) handleFiles(imageInput.files);
});
function handleFiles(files) {
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        dropZone.innerHTML = `<img src="${e.target.result}" alt="" style="max-height:80px; max-width:100%; border-radius:6px;">`;
    };
    reader.readAsDataURL(file);
}
mandatoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mandatoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
function toggleCategory(btn, cat) {
    const active = btn.classList.toggle('active');
    if (!active) {
        subOptionsDiv.innerHTML = '';
        return;
    }
    categoryButtons.forEach(b => { if (b !== btn) b.classList.remove('active'); });
    let opts = [];
    if (cat === 'genre') opts = ['🎵 장르', '팝', '재즈', '클래식', '힙합', '일렉트로닉'];
    if (cat === 'mood') opts = ['🎵 분위기', '활기찬', '슬픈', '로맨틱', '잔잔한'];
    if (cat === 'activity') opts = ['🎵 활동', '집중', '러닝', '휴식', '공부', '여행'];
    subOptionsDiv.innerHTML = opts.map((o, i) =>
        `<span class="sub-option" style="${i === 0 ? 'font-weight:bold;' : ''}">${o}</span>`
    ).join('');
}
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        toggleCategory(btn, cat);
    });
});

// 음악 생성 버튼 클릭 시 — Bark 음원 생성 API 호출 및 오디오 로딩
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('프롬프트를 입력하세요.');
        return;
    }

    resultsDiv.classList.remove('hidden');
    lyricsPre.textContent = '생성 중...';
    melodyPre.textContent = '생성 중...';

    const selectedType = document.querySelector('.mandatory-options .active').getAttribute('data-type');
    const calls = [];
    if (selectedType === 'both' || selectedType === 'lyrics') {
        calls.push(fetch('/generate-lyrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })
            .then(r => r.json())
            .then(j => {
                lyricsPre.textContent = j.lyrics || j.error;
            })
        );
    }
    if (selectedType === 'both' || selectedType === 'melody') {
        calls.push(fetch('/generate-melody', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })
            .then(r => r.json())
            .then(j => {
                melodyPre.textContent = j.melody || j.error;
            })
        );
    }
    await Promise.all(calls);

    // Bark 음원 생성 및 URL 받아서 오디오 세팅
    try {
        const res = await fetch('/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({
                prompt,
                lyrics: lyricsPre.textContent,
                style: document.querySelector('.category-options .active') ? document.querySelector('.category-options .active').textContent : ''
            })
        });
        const data = await res.json();
        if (res.ok && data.audioUrl) {
            setAudioSource(data.audioUrl);
        } else {
            alert(data.error || '음원 생성에 실패했습니다.');
        }
    } catch (err) {
        console.error('음원 생성 요청 실패:', err);
        alert('음원 생성 중 오류가 발생했습니다.');
    }
});

// 노래 저장 버튼 클릭 시
saveSongBtn.addEventListener('click', async () => {
    saveMessage.textContent = '';
    const prompt = promptInput.value.trim();
    const lyrics = lyricsPre.textContent;
    const melody = melodyPre.textContent;
    const style = document.querySelector('.category-options .active') ?
        document.querySelector('.category-options .active').textContent : '';
    if (!prompt) return alert('프롬프트가 필요합니다.');

    try {
        const res = await fetch('/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({
                prompt,
                lyrics,
                audio_url: null,
                style
            })
        });
        const data = await res.json();
        if (res.ok) {
            saveMessage.style.color = 'green';
            saveMessage.textContent = data.message || '저장 성공';
            await loadMySongs();
            await loadPublicSongs();
        } else {
            saveMessage.style.color = 'red';
            saveMessage.textContent = data.error;
        }
    } catch (err) {
        console.error('노래 저장 에러:', err);
        saveMessage.style.color = 'red';
        saveMessage.textContent = '노래 저장 중 오류가 발생했습니다.';
    }
});

// ——————————————————————————————
// 5) 내가 저장한 노래 & 공개된 노래 불러오기
// ——————————————————————————————
async function loadMySongs() {
    if (!authToken) return;
    mySongList.innerHTML = '';
    try {
        const res = await fetch('/songs/my', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        if (res.ok) {
            data.forEach(song => {
                const li = createSongListItem(song, true);
                mySongList.appendChild(li);
            });
        } else {
            console.error('내 노래 불러오기 오류:', data.error);
        }
    } catch (err) {
        console.error('내 노래 불러오기 예외:', err);
    }
}

async function loadPublicSongs() {
    publicSongList.innerHTML = '';
    try {
        const res = await fetch('/songs/public');
        const data = await res.json();
        if (res.ok) {
            data.forEach(song => {
                const li = createSongListItem(song, false);
                publicSongList.appendChild(li);
            });
        } else {
            console.error('공개 노래 불러오기 오류:', data.error);
        }
    } catch (err) {
        console.error('공개 노래 불러오기 예외:', err);
    }
}

/**
 * 노래 리스트 항목(li) 생성 함수
 * @param {object} song  - { id, user_id, prompt, lyrics, audio_url, style, created_at }
 * @param {boolean} isMy - 내 노래인가 여부
 */
function createSongListItem(song, isMy) {
    const li = document.createElement('li');
    li.dataset.songId = song.id;

    // 노래 제목/프롬프트 + 메타 정보(작성자, 작성일)
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('song-info');
    const promptP = document.createElement('p');
    promptP.classList.add('prompt-text');
    if (isMy) {
        promptP.textContent = `[${formatDate(song.created_at)}] ${song.prompt}`;
    } else {
        promptP.textContent = `[${formatDate(song.created_at)}] ${song.user_id ? song.user_id + '님' : ''}의 “${song.prompt}”`;
    }
    const metaP = document.createElement('p');
    metaP.classList.add('meta-text');
    metaP.textContent = `스타일: ${song.style || '없음'}`;

    infoDiv.appendChild(promptP);
    infoDiv.appendChild(metaP);

    // 버튼 그룹
    const btnGroup = document.createElement('div');
    btnGroup.classList.add('button-group');

    // 1) 좋아요 버튼
    const likeBtn = document.createElement('button');
    likeBtn.classList.add('like-btn');
    likeBtn.innerHTML = `★ <span class="like-count">0</span>`;

    // 초기 좋아요 개수 불러오기
    fetch(`/favorites/count/${song.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.count !== undefined) {
                likeBtn.querySelector('.like-count').textContent = data.count;
            }
        })
        .catch(err => console.error('좋아요 수 초기 조회 실패:', err));

    // 사용자가 이미 좋아요를 눌렀는지 확인해서 버튼 스타일 적용
    checkUserLiked(song.id).then((liked) => {
        if (liked) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.add('not-liked');
        }
    });

    // 좋아요 버튼 클릭 시 토글 처리
    likeBtn.addEventListener('click', async () => {
        if (!authToken) {
            alert('로그인 후 이용하세요.');
            return;
        }
        try {
            const res = await fetch(`/favorites/toggle/${song.id}`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + authToken }
            });
            const data = await res.json();
            if (res.ok) {
                if (data.liked) {
                    likeBtn.classList.remove('not-liked');
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.classList.add('not-liked');
                }
                const cntRes = await fetch(`/favorites/count/${song.id}`);
                const cntData = await cntRes.json();
                if (cntRes.ok && cntData.count !== undefined) {
                    likeBtn.querySelector('.like-count').textContent = cntData.count;
                }
            } else {
                console.error('좋아요 토글 실패:', data.error);
                alert(data.error);
            }
        } catch (err) {
            console.error('좋아요 토글 예외:', err);
        }
    });

    // 2) 댓글 버튼
    const commentBtn = document.createElement('button');
    commentBtn.classList.add('comment-btn');
    commentBtn.textContent = '💬';
    commentBtn.addEventListener('click', () => {
        if (!authToken) {
            alert('로그인 후 이용하세요.');
            return;
        }
        currentSongIdForComments = song.id;
        openCommentModal(song.id);
    });

    btnGroup.appendChild(likeBtn);
    btnGroup.appendChild(commentBtn);

    li.appendChild(infoDiv);
    li.appendChild(btnGroup);

    return li;
}

// ——————————————————————————————
// 6) 좋아요 상태 확인 함수
// ——————————————————————————————
async function checkUserLiked(songId) {
    if (!authToken) return false;
    try {
        const res = await fetch(`/favorites/user/${songId}`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        if (res.ok) {
            return data.liked;
        }
        return false;
    } catch (err) {
        console.error('유저 좋아요 여부 확인 예외:', err);
        return false;
    }
}

// ——————————————————————————————
// 7) 댓글 모달 열기/닫기 및 댓글 CRUD
// ——————————————————————————————
async function openCommentModal(songId) {
    commentList.innerHTML = '';
    commentInput.value = '';
    commentMessage.textContent = '';

    try {
        const res = await fetch(`/comments/${songId}`);
        const data = await res.json();
        if (res.ok) {
            data.forEach(c => {
                const li = document.createElement('li');
                li.textContent = `${c.username}: ${c.content} [${formatDate(c.created_at)}]`;
                commentList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('댓글 목록 불러오기 예외:', err);
    }

    openModal(commentModal);
}

commentSubmit.addEventListener('click', async () => {
    commentMessage.textContent = '';
    const content = commentInput.value.trim();
    if (!content) {
        commentMessage.textContent = '댓글을 입력하세요.';
        return;
    }
    try {
        const res = await fetch(`/comments/${currentSongIdForComments}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        if (res.ok) {
            await openCommentModal(currentSongIdForComments);
        } else {
            commentMessage.textContent = data.error;
        }
    } catch (err) {
        console.error('댓글 등록 예외:', err);
        commentMessage.textContent = '댓글 등록 중 오류가 발생했습니다.';
    }
});

// ——————————————————————————————
// 8) 날짜 포맷팅 유틸리티
// ——————————————————————————————
function formatDate(dateString) {
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const formatted = `${yyyy}. ${mm}. ${dd}. ${padAmPm(d)} ${padHour(d)}:${mi}`;
    return formatted;
}
function padAmPm(d) {
    return d.getHours() < 12 ? '오전' : '오후';
}
function padHour(d) {
    const h = d.getHours();
    return String((h % 12) || 12).padStart(2, '0');
}

// ——————————————————————————————
// 9) 페이지 로드 시 초기 화면 설정
// ——————————————————————————————
document.addEventListener('DOMContentLoaded', () => {
    generateSection.classList.add('hidden');
    mySongsSection.classList.add('hidden');
    publicSongsSection.classList.add('hidden');
});
