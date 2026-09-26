(function () {
  var audio = document.getElementById('audio');
  if (!audio) return;
  var playBtn = document.getElementById('play');
  var state = document.getElementById('state');
  var seek = document.getElementById('seek');
  var cur = document.getElementById('cur');
  var dur = document.getElementById('dur');
  var speed = document.getElementById('speed');
  var resume = document.getElementById('resume');
  var resumeAt = document.getElementById('resumeAt');
  var err = document.getElementById('error');
  var KEY = 'pos:' + audio.getAttribute('data-id');
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var seeking = false;

  function fmt(t) {
    if (!isFinite(t) || t < 0) return '--:--';
    t = Math.floor(t);
    return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
  }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function render() {
    var playing = !audio.paused && !audio.ended;
    playBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    playBtn.setAttribute('aria-label', playing ? '一時停止' : '再生');
    state.textContent = audio.ended ? 'おつかれさまでした (再生終了)' : (playing ? '再生中' : (audio.currentTime > 0 ? '一時停止中' : 'ボタンを押すと再生が始まります'));
  }
  playBtn.addEventListener('click', function () {
    if (audio.paused || audio.ended) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { err.classList.add('show'); });
    } else audio.pause();
  });
  ['play', 'pause', 'ended'].forEach(function (e) { audio.addEventListener(e, render); });
  audio.addEventListener('loadedmetadata', function () {
    seek.max = audio.duration; dur.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', function () {
    if (!seeking) seek.value = audio.currentTime;
    cur.textContent = fmt(audio.currentTime);
    if (audio.currentTime > 5 && !audio.ended) store(KEY, String(Math.floor(audio.currentTime)));
  });
  audio.addEventListener('ended', function () { store(KEY, null); });
  audio.addEventListener('error', function () { err.classList.add('show'); state.textContent = '音声を読み込めませんでした'; });
  seek.addEventListener('input', function () { seeking = true; cur.textContent = fmt(+seek.value); });
  seek.addEventListener('change', function () { audio.currentTime = +seek.value; seeking = false; });
  document.getElementById('back').addEventListener('click', function () { audio.currentTime = Math.max(0, audio.currentTime - 10); });
  document.getElementById('fwd').addEventListener('click', function () {
    if (isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration - 0.5, audio.currentTime + 10);
  });
  speed.addEventListener('change', function () { audio.playbackRate = +speed.value; });

  var saved = +load(KEY);
  if (saved > 5) {
    resumeAt.textContent = fmt(saved);
    resume.classList.add('show');
    document.getElementById('resumeYes').addEventListener('click', function () {
      audio.currentTime = saved; resume.classList.remove('show');
      var p = audio.play(); if (p && p.catch) p.catch(function () {});
    });
    document.getElementById('resumeNo').addEventListener('click', function () {
      store(KEY, null); resume.classList.remove('show');
    });
  }

  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: document.title, artist: '英検準1級 本番形式 模擬試験 5回分' });
      navigator.mediaSession.setActionHandler('seekbackward', function () { audio.currentTime = Math.max(0, audio.currentTime - 10); });
      navigator.mediaSession.setActionHandler('seekforward', function () { audio.currentTime += 10; });
    } catch (e) {}
  }
  render();
})();
