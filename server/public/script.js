// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    let authToken = null
    let currentSongId = null

    // --- DOM 요소 셋업 ---
    const loginBtn = document.getElementById('loginBtn')
    const signupBtn = document.getElementById('signupBtn')
    const logoutBtn = document.getElementById('logoutBtn')
    const headerCtrls = document.getElementById('headerControls')
    const profileSec = document.getElementById('profileSection')
    const profileNameEl = document.getElementById('profileName')

    const loginModal = document.getElementById('loginModal')
    const signupModal = document.getElementById('signupModal')
    const commentModal = document.getElementById('commentModal')
    const closeLogin = document.getElementById('closeLogin')
    const closeSignup = document.getElementById('closeSignup')
    const closeComment = document.getElementById('closeComment')

    const loginSubmit = document.getElementById('loginSubmit')
    const signupSubmit = document.getElementById('signupSubmit')
    const loginMsg = document.getElementById('loginMessage')
    const signupMsg = document.getElementById('signupMessage')

    const generateSection = document.getElementById('generateSection')
    const promptInput = document.getElementById('promptInput')
    const dropZone = document.getElementById('dropZone')
    const imageInput = document.getElementById('imageInput')
    const mandatoryBtns = document.querySelectorAll('.mandatory-options .option-btn')
    const categoryBtns = document.querySelectorAll('.category-options .option-btn')
    const subOptions = document.getElementById('subOptions')
    const generateBtn = document.getElementById('generateBtn')
    const resultsDiv = document.getElementById('results')
    const lyricsPre = document.getElementById('lyrics')
    const melodyPre = document.getElementById('melody')
    const saveSongBtn = document.getElementById('saveSongBtn')
    const saveMsg = document.getElementById('saveMessage')

    const mySongsSection = document.getElementById('mySongsSection')
    const songList = document.getElementById('songList')

    const commentList = document.getElementById('commentList')
    const newComment = document.getElementById('newComment')
    const postCommentBtn = document.getElementById('postCommentBtn')

    // --- 모달 열기/닫기 헬퍼 ---
    const openModal = el => el.classList.remove('hidden')
    const closeModal = el => el.classList.add('hidden')

    // --- 로그인/회원가입 버튼 클릭 ---
    loginBtn.onclick = () => { loginMsg.textContent = ''; openModal(loginModal) }
    signupBtn.onclick = () => { signupMsg.textContent = ''; openModal(signupModal) }
    closeLogin.onclick = () => closeModal(loginModal)
    closeSignup.onclick = () => closeModal(signupModal)
    loginModal.onclick = e => { if (e.target === loginModal) closeModal(loginModal) }
    signupModal.onclick = e => { if (e.target === signupModal) closeModal(signupModal) }

    // --- 댓글 모달 닫기 ---
    closeComment.onclick = () => closeModal(commentModal)
    commentModal.onclick = e => { if (e.target === commentModal) closeModal(commentModal) }

    // --- 회원가입 ---
    signupSubmit.onclick = async () => {
        signupMsg.textContent = ''
        const email = document.getElementById('signupEmail').value.trim()
        const pwd = document.getElementById('signupPassword').value
        const name = document.getElementById('signupUsername').value.trim()
        if (!email || !pwd || !name) {
            signupMsg.textContent = '모두 입력하세요.'
            return
        }

        const res = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pwd, username: name })
        })
        const j = await res.json()
        if (j.message) {
            signupMsg.textContent = '회원가입 성공! 로그인 해주세요.'
            setTimeout(() => {
                closeModal(signupModal)
                openModal(loginModal)
            }, 800)
        } else {
            signupMsg.textContent = j.error
        }
    }

    // --- 로그인 ---
    loginSubmit.onclick = async () => {
        loginMsg.textContent = ''
        const email = document.getElementById('loginEmail').value.trim()
        const pwd = document.getElementById('loginPassword').value
        if (!email || !pwd) {
            loginMsg.textContent = '모두 입력하세요.'
            return
        }

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pwd })
        })
        const j = await res.json()
        if (j.token) {
            authToken = j.token
            profileNameEl.textContent = `안녕하세요, 🎵${j.username}님`
            closeModal(loginModal)
            headerCtrls.classList.add('hidden')
            profileSec.classList.remove('hidden')
            openModal(generateSection)
            openModal(mySongsSection)
            loadMySongs()
        } else {
            loginMsg.textContent = j.error
        }
    }

    // --- 로그아웃 ---
    logoutBtn.onclick = () => {
        authToken = null
        profileSec.classList.add('hidden')
        headerCtrls.classList.remove('hidden')
        closeModal(generateSection)
        closeModal(mySongsSection)
    }

    // --- 이미지 업로드 처리 ---
    dropZone.onclick = () => imageInput.click()
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover') })
    dropZone.addEventListener('dragleave', e => dropZone.classList.remove('dragover'))
    dropZone.addEventListener('drop', e => {
        e.preventDefault()
        dropZone.classList.remove('dragover')
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    })
    imageInput.onchange = () => { if (imageInput.files.length) handleFiles(imageInput.files) }
    function handleFiles(files) {
        const file = files[0]
        if (!file.type.startsWith('image/')) {
            alert('이미지만 업로드 가능합니다.')
            return
        }
        const reader = new FileReader()
        reader.onload = e => {
            dropZone.innerHTML = `<img src="${e.target.result}" style="max-height:80px; border-radius:6px;">`
        }
        reader.readAsDataURL(file)
    }

    // --- 옵션 토글 ---
    mandatoryBtns.forEach(b => b.onclick = () => {
        mandatoryBtns.forEach(x => x.classList.remove('active'))
        b.classList.add('active')
    })
    categoryBtns.forEach(b => b.onclick = () => {
        const cat = b.dataset.cat
        const isActive = b.classList.toggle('active')
        categoryBtns.forEach(x => { if (x !== b) x.classList.remove('active') })
        subOptions.innerHTML = ''
        if (!isActive) return
        let opts = []
        if (cat === 'genre') opts = ['🎵 장르', '팝', '재즈', '클래식', '힙합', '일렉트로닉']
        if (cat === 'mood') opts = ['🎵 분위기', '활기찬', '슬픈', '로맨틱', '잔잔한']
        if (cat === 'activity') opts = ['🎵 활동', '집중', '러닝', '휴식', '공부', '여행']
        opts.forEach((o, i) => {
            const sp = document.createElement('span')
            sp.className = 'sub-option'
            sp.style.fontWeight = i === 0 ? 'bold' : 'normal'
            sp.textContent = o
            subOptions.append(sp)
        })
    })

    // --- 음악 생성 & 저장 ---
    generateBtn.onclick = async () => {
        const prompt = promptInput.value.trim()
        if (!prompt) return alert('프롬프트를 입력하세요.')
        openModal(resultsDiv)
        lyricsPre.textContent = '생성 중...'
        melodyPre.textContent = '생성 중...'

        const type = document.querySelector('.mandatory-options .active').dataset.type
        const calls = []
        if (type === 'both' || type === 'lyrics') {
            calls.push(fetch('/generate-lyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            }).then(r => r.json()).then(j => lyricsPre.textContent = j.lyrics || j.error))
        }
        if (type === 'both' || type === 'melody') {
            calls.push(fetch('/generate-melody', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            }).then(r => r.json()).then(j => melodyPre.textContent = j.melody || j.error))
        }
        await Promise.all(calls)
    }

    saveSongBtn.onclick = async () => {
        const res = await fetch('/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + authToken
            },
            body: JSON.stringify({
                prompt: promptInput.value,
                lyrics: lyricsPre.textContent,
                audio_url: null
            })
        })
        const j = await res.json()
        saveMsg.textContent = j.message || j.error
        if (j.message) loadMySongs()
    }

    // --- 내가 저장한 노래 로드 & ★/💬 버튼 바인딩 ---
    async function loadMySongs() {
        if (!authToken) return
        const res = await fetch('/songs', {
            headers: { Authorization: 'Bearer ' + authToken }
        })
        const songs = await res.json()
        songList.innerHTML = ''
        songs.forEach(s => {
            const li = document.createElement('li')
            li.innerHTML = `
          <span>[${new Date(s.created_at).toLocaleString()}] ${s.prompt}</span>
          <button class="fav-btn" data-id="${s.id}">★</button>
          <button class="comment-btn" data-id="${s.id}">💬</button>
        `
            songList.append(li)
        })
        document.querySelectorAll('.fav-btn').forEach(b => {
            b.onclick = () => toggleFavorite(b.dataset.id, b)
        })
        document.querySelectorAll('.comment-btn').forEach(b => {
            b.onclick = () => openCommentBox(b.dataset.id)
        })
    }

    // --- 즐겨찾기(★) 기능 ---
    async function toggleFavorite(songId, btn) {
        await fetch('/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + authToken
            },
            body: JSON.stringify({ song_id: songId })
        })
        btn.textContent = '✓'
    }

    // --- 댓글 모달 & 로드 ---
    function openCommentBox(songId) {
        currentSongId = songId
        commentList.innerHTML = '불러오는 중...'
        openModal(commentModal)
        fetch(`/comments/${songId}`)
            .then(r => r.json())
            .then(arr => {
                commentList.innerHTML = arr.map(c =>
                    `<p><strong>${c.username}</strong> (${new Date(c.created_at).toLocaleString()}):<br>${c.content}</p>`
                ).join('')
            })
    }

    // --- 댓글 전송 ---
    postCommentBtn.onclick = () => {
        fetch('/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + authToken
            },
            body: JSON.stringify({
                song_id: currentSongId,
                content: newComment.value
            })
        })
            .then(r => r.json())
            .then(j => {
                if (j.message) openCommentBox(currentSongId)
            })
    }
})
