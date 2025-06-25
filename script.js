document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소 캐싱
    const mainButtons = document.querySelectorAll(".main-btn");
    const subButtons = document.querySelectorAll(".sub-btn");
    const dynamicButtons = document.getElementById("dynamic-buttons");
    const generateBtn = document.querySelector(".generate-btn");
    const imageInput = document.getElementById("image-input");
    const imagePreview = document.getElementById("image-preview");
    const lyricsPreview = document.getElementById("lyrics-preview");
    const melodyPreview = document.querySelector(".melody-preview audio source");
    const loginBtn = document.getElementById("login-btn");
    const joinBtn = document.getElementById("join-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginModal = document.getElementById("login-modal");
    const joinModal = document.getElementById("join-modal");
    const loginForm = document.getElementById("login-form");
    const joinForm = document.getElementById("join-form");
    const closeModal = document.querySelectorAll(".close");

    // 상태 변수
    let mainSelected = null;
    let subSelected = null;
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let currentUser = localStorage.getItem("currentUser") || null;

    // 동적 옵션 정의
    const dynamicOptions = {
        genre: ["pop", "jazz", "classic", "hip-hop", "electronic", "house"],
        mood: ["beautiful", "dreamy", "sad", "groove", "sensual", "calm"],
        activity: ["rest", "video game", "charming", "lovely", "rest chillout", "sleepy ambient"]
    };

    // 버튼 클릭 네온 효과
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.filter = 'drop-shadow(0 0 2px var(--pico-yellow))';
            setTimeout(() => btn.style.filter = 'none', 200);
        });
    });

    // 로그인/로그아웃 상태 업데이트
    function updateAuthStatus() {
        if (isLoggedIn) {
            loginBtn.style.display = 'none';
            joinBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            loginBtn.style.display = 'inline-block';
            joinBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }

    updateAuthStatus();

    // 모달 열기/닫기
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    joinBtn.addEventListener('click', () => {
        joinModal.style.display = 'block';
    });

    closeModal.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            joinModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === joinModal) joinModal.style.display = 'none';
    });

    // 로그인 처리
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById("login-id").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            if (!response.ok) throw new Error('Login failed');
            const data = await response.json();
            isLoggedIn = true;
            currentUser = id;
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", id);
            localStorage.setItem("userId", data.userId);
            updateAuthStatus();
            loginModal.style.display = 'none';
            alert('Login successful!');
        } catch (error) {
            console.error('Login error:', error);
            alert('로그인 실패. 아이디 또는 비밀번호를 확인하세요.');
        }
    });

    // 회원가입 처리
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById("join-id").value;
        const password = document.getElementById("join-password").value;
        const passwordConfirm = document.getElementById("join-password-confirm").value;

        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다!');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            if (!response.ok) throw new Error('Registration failed');
            joinModal.style.display = 'none';
            alert('회원가입 성공! 로그인하세요.');
        } catch (error) {
            console.error('Registration error:', error);
            alert('회원가입 실패. 다시 시도하세요.');
        }
    });

    // 로그아웃 처리
    logoutBtn.addEventListener('click', () => {
        isLoggedIn = false;
        currentUser = null;
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("currentUser");
        updateAuthStatus();
        alert('Logged out successfully!');
    });

    // 메인 버튼 클릭 처리
    mainButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            mainButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            mainSelected = btn.textContent;
        });
    });

    // 서브 버튼 클릭 처리
    subButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            subButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            subSelected = btn.getAttribute("data-type");

            dynamicButtons.innerHTML = "";
            dynamicOptions[subSelected]?.forEach(option => {
                const optionBtn = document.createElement("button");
                optionBtn.textContent = option;
                optionBtn.classList.add("dynamic-btn");
                optionBtn.addEventListener("click", () => {
                    optionBtn.classList.toggle("selected");
                });
                dynamicButtons.appendChild(optionBtn);
            });
        });
    });

    // 이미지 업로드 처리
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // 노래 렌더링 함수
    function renderSong(song, containerId) {
        const songList = document.getElementById(containerId);
        if (!songList) return;

        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.innerHTML = `
            <div class="song-info">
                <span class="song-title">${song.title}</span>
                <span class="song-datetime">${song.datetime}</span>
            </div>
            <div class="song-actions">
                <button class="like-btn" data-liked="false">★</button>
                <span class="like-count">${song.likes}</span>
                <input type="text" class="comment-input" placeholder="Enter comment">
                <button class="comment-btn">comment</button>
            </div>
            <div class="comment-list" data-song-id="${song.id}"></div>
        `;

        const likeBtn = songItem.querySelector('.like-btn');
        const likeCount = songItem.querySelector('.like-count');
        const commentInput = songItem.querySelector('.comment-input');
        const commentBtn = songItem.querySelector('.comment-btn');
        const commentList = songItem.querySelector('.comment-list');

        // 좋아요 처리
        likeBtn.addEventListener('click', async () => {
            const userId = currentUser || 'guest'; // 비로그인 시 guest 사용
            const isLiked = likeBtn.dataset.liked === 'true';
            likeBtn.dataset.liked = !isLiked;
            likeBtn.classList.toggle('liked');
            const newCount = parseInt(likeCount.textContent) + (isLiked ? -1 : 1);
            likeCount.textContent = newCount;

            try {
                await fetch('http://localhost:3000/like', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songId: song.id, userId, liked: !isLiked })
                });
            } catch (error) {
                console.error('Like error:', error);
            }
        });

        // 댓글 처리
        commentBtn.addEventListener('click', async () => {
            const userId = currentUser || 'guest'; // 비로그인 시 guest 사용
            const commentText = commentInput.value.trim();
            if (commentText) {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.textContent = `${userId}: ${commentText}`;
                commentList.appendChild(commentItem);
                commentInput.value = '';

                try {
                    await fetch('http://localhost:3000/comments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ songId: song.id, userId, comment: commentText })
                    });
                } catch (error) {
                    console.error('Comment error:', error);
                }
            }
        });

        // 기존 댓글 로드
        if (song.comments) {
            song.comments.forEach(comment => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.textContent = `${comment.userId}: ${comment.text}`;
                commentList.appendChild(commentItem);
            });
        }

        songList.appendChild(songItem);
    }

    // 노래 데이터 로드
    async function loadSongs() {
        try {
            const userId = localStorage.getItem("userId");
            const mySongsResponse = await fetch(`http://localhost:3000/my-songs?userId=${userId}`);
            const publicSongsResponse = await fetch('http://localhost:3000/public-songs');
            const mySongs = await mySongsResponse.json();
            const publicSongs = await publicSongsResponse.json();
            mySongs.forEach(song => renderSong(song, 'my-songs'));
            publicSongs.forEach(song => renderSong(song, 'public-songs'));
        } catch (error) {
            console.error('Load songs error:', error);
            const mySongs = [
                { id: '1', title: 'My Song 1', datetime: '2025-06-24 17:30', likes: 5, comments: [{ userId: 'user1', text: 'Great song!' }] },
                { id: '2', title: 'My Song 2', datetime: '2025-06-24 17:00', likes: 3, comments: [] },
            ];
            const publicSongs = [
                { id: '3', title: 'Public Song 1', datetime: '2025-06-24 17:45', likes: 10, comments: [{ userId: 'user2', text: 'Awesome!' }] },
                { id: '4', title: 'Public Song 2', datetime: '2025-06-24 17:15', likes: 8, comments: [] },
            ];
            mySongs.forEach(song => renderSong(song, 'my-songs'));
            publicSongs.forEach(song => renderSong(song, 'public-songs'));
        }
    }

    loadSongs();
});