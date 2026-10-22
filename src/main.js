import './styles/main.css';
import worldData from '../data/world.json';
import assetReport from '../data/asset-report.json';
import { AppState } from './app/AppState.js';
import { GameClock } from './app/GameClock.js';
import { InputManager } from './app/InputManager.js';
import { SaveManager } from './app/SaveManager.js';
import { canStartLearning, fatigue, hunger, nextWakeMinute } from './logic/NeedsSystem.js';
import { scoreWorld } from './logic/Score.js';
import { getWordState, studyEncounter, submitPractice } from './logic/WordStateMachine.js';
import { HomeCanvas } from './render/HomeCanvas.js';
import { generateSceneLayout, isWalkable, nearestFeature, nearestWord } from './render/MapGenerator.js';
import { Completion } from './ui/Completion.js';
import { HelpOverlay } from './ui/HelpOverlay.js';
import { HUD } from './ui/HUD.js';
import { MiniMap } from './ui/MiniMap.js';
import { ModeSelect } from './ui/ModeSelect.js';
import { Onboarding } from './ui/Onboarding.js';
import { VocabCard } from './ui/VocabCard.js';

const app = document.querySelector('#app');
app.innerHTML = `<div class="loading-screen"><div class="loader-orbit"><i></i><i></i><i></i><span>HA</span></div><p>正在整理 HOME 的灯光与词汇…</p><small>12 个房间 · 85 个区域 · 524 个词汇</small></div>`;

const placeholderPaths = new Set(assetReport.knownPlaceholderPaths.map((item) => item.replace(/\\/g, '/')));
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await Promise.all([preloadImage('/assets/home/home-map.png'), delay(650)]);

app.innerHTML = `
  <div class="game-shell">
    <div id="hud-root"></div>
    <main class="game-content">
      <section class="map-column">
        <div class="map-stage" id="map-stage">
          <canvas id="home-canvas" aria-label="HOME 二维地图"></canvas>
          <div id="scene-root" aria-label="2.5D 记忆地图" hidden></div>
          <div class="minimap-shell" id="minimap-shell" hidden><canvas id="minimap"></canvas></div>
          <div class="interaction-prompt" id="interaction-prompt" hidden></div>
          <div class="notice-stack" id="notice-stack" aria-live="polite"></div>
          <div class="scene-title-card" id="scene-title-card" hidden></div>
        </div>
      </section>
      <aside class="memory-panel" id="memory-panel" aria-label="当前记忆卡"></aside>
    </main>
    <div id="mode-root" hidden></div>
    <div id="help-root" hidden></div>
    <div id="onboarding-root" hidden></div>
    <div id="completion-root" hidden></div>
    <div id="recovery-root" hidden></div>
  </div>`;

const elements = {
  homeCanvas: document.querySelector('#home-canvas'),
  sceneRoot: document.querySelector('#scene-root'),
  mapStage: document.querySelector('#map-stage'),
  memoryPanel: document.querySelector('#memory-panel'),
  prompt: document.querySelector('#interaction-prompt'),
  minimapShell: document.querySelector('#minimap-shell'),
  sceneTitle: document.querySelector('#scene-title-card'),
  recovery: document.querySelector('#recovery-root'),
};

const saveManager = new SaveManager(showNotice);
const state = new AppState(saveManager.load(), saveManager);
const save = state.save;
const homePlayer = {
  x: save.location.coordinateSpace === 'home-normalized' ? save.location.x : 0.505,
  z: save.location.coordinateSpace === 'home-normalized' ? save.location.z : 0.65,
};
let currentScene = null;
let layout = null;
let sceneRenderer = null;
let SceneRendererClass = null;
let scenePlayer = { x: 0, z: 3.45 };
let mode = null;
let activeWord = null;
let activeFeature = null;
let practiceRound = null;
let lastFrame = performance.now();
let lastPositionSave = performance.now();
let overlayPaused = false;
let recoveryBusy = false;

const hud = new HUD(document.querySelector('#hud-root'), worldData, () => toggleHelp());
const vocab = new VocabCard(elements.memoryPanel, { onSubmit: submitCurrentPractice, onSpeak: speakWord });
const modeSelect = new ModeSelect(document.querySelector('#mode-root'), enterScene, () => updatePause());
const help = new HelpOverlay(document.querySelector('#help-root'), () => updatePause());
const completion = new Completion(document.querySelector('#completion-root'), continueWorld, resetWorld);
const onboarding = new Onboarding(document.querySelector('#onboarding-root'), finishOnboarding);
const miniMap = new MiniMap(document.querySelector('#minimap'));
const home = new HomeCanvas(elements.homeCanvas, worldData, homePlayer, save.player.skin);
const input = new InputManager(handleAction);
const clock = new GameClock(save, () => hud.render(save, currentScene, mode));

window.addEventListener('resize', resize);
window.addEventListener('beforeunload', persistPosition);
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); updatePause(); });

if (!save.onboardingSeen) {
  onboarding.open();
  overlayPaused = true;
} else if (save.location.sceneId && save.location.sceneId !== 'home') {
  const restoredScene = worldData.scenes.find((scene) => scene.id === save.location.sceneId);
  if (restoredScene && ['study', 'practice'].includes(save.location.mode)) enterScene(restoredScene, save.location.mode, true);
}

resize();
hud.render(save, currentScene, mode);
updatePause();
requestAnimationFrame(loop);

window.__HOME_ATLAS_DEBUG__ = {
  world: worldData,
  save,
  get view() { return currentScene ? 'scene' : 'home'; },
  get currentScene() { return currentScene?.id || null; },
  get mode() { return mode; },
  get player() { return currentScene ? { ...scenePlayer } : { ...homePlayer }; },
  moveHomeTo(sceneId) {
    const scene = worldData.scenes.find((item) => item.id === sceneId);
    if (!scene) return false;
    homePlayer.x = scene.homeHotspot.x;
    homePlayer.z = scene.homeHotspot.y;
    home.update(0, { x: 0, y: 0 }, true);
    return true;
  },
  moveSceneToFirstWord() {
    const word = layout?.areas[0]?.words[0];
    if (!word) return null;
    scenePlayer.x = word.position.x;
    scenePlayer.z = word.position.z;
    changeActiveWord(word);
    return word.id;
  },
};

function finishOnboarding(player) {
  save.player = player;
  save.onboardingSeen = true;
  home.skin = player.skin;
  overlayPaused = false;
  saveManager.save(save);
  hud.render(save, currentScene, mode);
  updatePause();
  showNotice(`欢迎，${player.name}。去靠近一个房间吧。`, 'success');
}

async function enterScene(scene, selectedMode, restoring = false) {
  currentScene = scene;
  mode = selectedMode;
  activeWord = null;
  practiceRound = null;
  layout = generateSceneLayout(scene);
  scenePlayer = restoring && save.location.coordinateSpace === 'scene-world'
    ? { x: save.location.x, z: save.location.z }
    : { x: 0, z: 3.45 };
  if (!isWalkable(layout, scenePlayer)) scenePlayer = { x: 0, z: 3.45 };
  elements.homeCanvas.hidden = true;
  elements.sceneRoot.hidden = false;
  elements.minimapShell.hidden = false;
  elements.sceneTitle.hidden = false;
  elements.sceneTitle.innerHTML = `<span>${scene.name.toUpperCase()}</span><small>${scene.areas.length} 个区域 · ${scene.areas.reduce((sum, area) => sum + area.words.length, 0)} 个词汇</small>`;
  elements.sceneRoot.innerHTML = '<div class="scene-loading"><span>✦</span><p>正在铺开记忆地图…</p></div>';
  try {
    sceneRenderer?.dispose();
    if (!SceneRendererClass) ({ SceneRenderer3D: SceneRendererClass } = await import('./render/SceneRenderer3D.js'));
    if (currentScene?.id !== scene.id) return;
    sceneRenderer = new SceneRendererClass(elements.sceneRoot, layout, save.player.skin, mode, save.wordStates);
  } catch (error) {
    elements.sceneRoot.innerHTML = `<div class="webgl-error"><h2>无法开启 2.5D 地图</h2><p>${error.message}</p><button type="button" id="webgl-home">返回 HOME</button></div>`;
    elements.sceneRoot.querySelector('#webgl-home').addEventListener('click', exitToHome);
  }
  miniMap.setScene(layout, scenePlayer);
  state.setLocation({ sceneId: scene.id, x: scenePlayer.x, z: scenePlayer.z, mode, coordinateSpace: 'scene-world' });
  vocab.renderEmpty(mode === 'study' ? '靠近一件物品，自动点亮词汇。' : '靠近图片后按 F，开始拼写练习。');
  hud.render(save, scene, mode);
  resize();
  updatePause();
  showNotice(`${scene.name} · ${mode === 'study' ? '学习模式' : '练习模式'}`, 'info');
}

function exitToHome() {
  if (!currentScene) return;
  const hotspot = currentScene.homeHotspot;
  homePlayer.x = Math.max(0.03, Math.min(0.97, hotspot.x + hotspot.radius * 1.22));
  homePlayer.z = hotspot.y;
  persistPosition();
  currentScene = null;
  mode = null;
  activeWord = null;
  practiceRound = null;
  activeFeature = null;
  sceneRenderer?.dispose();
  sceneRenderer = null;
  elements.homeCanvas.hidden = false;
  elements.sceneRoot.hidden = true;
  elements.minimapShell.hidden = true;
  elements.sceneTitle.hidden = true;
  vocab.renderEmpty();
  state.setLocation({ sceneId: 'home', x: homePlayer.x, z: homePlayer.z, mode: null, coordinateSpace: 'home-normalized' });
  hud.render(save, null, null);
  resize();
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  clock.tick(now);
  const paused = isGamePaused();
  if (currentScene) updateScene(dt, paused);
  else updateHome(dt, paused);
  if (now - lastPositionSave > 4000) {
    persistPosition();
    lastPositionSave = now;
  }
  requestAnimationFrame(loop);
}

function updateHome(dt, paused) {
  const activeScene = home.update(dt, input.movementVector(), paused);
  elements.prompt.hidden = !activeScene;
  if (activeScene) elements.prompt.innerHTML = `<kbd>Space</kbd><span>进入 ${activeScene.name}</span>`;
}

function updateScene(dt, paused) {
  if (!layout) return;
  if (!paused && !InputManager.isEditable()) {
    const movement = sceneRenderer?.screenToWorld(input.movementVector()) || { x: 0, z: 0 };
    const speed = 6.1;
    const proposed = { x: scenePlayer.x + movement.x * speed * dt, z: scenePlayer.z + movement.z * speed * dt };
    if (isWalkable(layout, proposed)) {
      scenePlayer.x = proposed.x; scenePlayer.z = proposed.z;
    } else {
      const xOnly = { x: proposed.x, z: scenePlayer.z };
      const zOnly = { x: scenePlayer.x, z: proposed.z };
      if (isWalkable(layout, xOnly)) scenePlayer.x = xOnly.x;
      else if (isWalkable(layout, zOnly)) scenePlayer.z = zOnly.z;
    }
  }
  sceneRenderer?.setPlayer(scenePlayer);
  sceneRenderer?.render(scenePlayer, dt);
  miniMap.update();
  activeFeature = nearestFeature(layout, scenePlayer);
  const nearest = nearestWord(layout, scenePlayer, activeWord?.id);
  if (nearest?.id !== activeWord?.id) changeActiveWord(nearest);
  sceneRenderer?.setActiveWord(activeWord?.id || null);
  renderScenePrompt();
}

function changeActiveWord(word) {
  if (!word) {
    activeWord = null;
    practiceRound = null;
    vocab.clearFeedback();
    vocab.renderEmpty(needsMessage() || (mode === 'study' ? '靠近一件物品，自动点亮词汇。' : '靠近图片后按 F，开始拼写练习。'));
    return;
  }
  if (!canStartLearning(save)) {
    activeWord = null;
    practiceRound = null;
    vocab.renderEmpty(needsMessage());
    return;
  }
  activeWord = word;
  vocab.clearFeedback();
  practiceRound = { wordId: word.id, mistakeInRound: false };
  const placeholder = isPlaceholder(word);
  if (mode === 'study') {
    const current = getWordState(save.wordStates, word.id);
    const next = studyEncounter(current);
    const result = state.commitWordState(word.id, next);
    if (result.changed) {
      sceneRenderer?.updateWordState(word.id, next);
      showNotice('+2 · 词汇已点亮', 'gold');
      playSound('/assets/sounds/success.wav', 0.28);
      checkCompletion();
    }
    vocab.showStudy(word, save.wordStates, placeholder);
  } else {
    vocab.showPractice(word, save.wordStates, practiceRound, placeholder);
  }
  hud.render(save, currentScene, mode);
}

function submitCurrentPractice(answer) {
  if (mode !== 'practice' || !activeWord || !practiceRound) return;
  const currentState = getWordState(save.wordStates, activeWord.id);
  const outcome = submitPractice({ answer, expected: activeWord.word, mistakeInRound: practiceRound.mistakeInRound, currentState });
  if (!outcome.accepted) {
    vocab.setFeedback(activeWord.id, '先输入一个英文答案。', 'neutral');
    return;
  }
  practiceRound.mistakeInRound = outcome.mistakeInRound;
  const result = state.commitWordState(activeWord.id, outcome.state);
  sceneRenderer?.updateWordState(activeWord.id, outcome.state);
  vocab.showPractice(activeWord, save.wordStates, practiceRound, isPlaceholder(activeWord));
  const deltaText = result.delta ? ` · ${result.delta > 0 ? '+' : ''}${result.delta}` : '';
  if (outcome.correct) {
    const message = outcome.state === 'CORRECT_RETRY' ? `这次记住了！${deltaText}` : `答对了！${deltaText}`;
    vocab.setFeedback(activeWord.id, message, 'correct');
    showNotice(message, outcome.state === 'CORRECT_RETRY' ? 'amber' : 'success');
    playSound('/assets/sounds/success.wav', 0.45);
  } else {
    const message = `再试一次${deltaText}`;
    vocab.setFeedback(activeWord.id, message, 'wrong');
    showNotice(message, 'error');
    playSound('/assets/sounds/uhoh.wav', 0.38);
  }
  hud.render(save, currentScene, mode);
  checkCompletion();
}

function handleAction(code) {
  if (!document.querySelector('#onboarding-root').hidden || recoveryBusy) return;
  if (help.isOpen) {
    if (code === 'Escape' || code === 'Slash') help.close();
    return;
  }
  if (!document.querySelector('#completion-root').hidden) return;
  if (modeSelect.isOpen) {
    if (code === 'KeyR') modeSelect.choose('study');
    else if (code === 'KeyF') modeSelect.choose('practice');
    else if (code === 'Escape') modeSelect.close();
    return;
  }
  if (code === 'Slash') { help.open(); updatePause(); return; }
  if (code === 'escape-input') return;
  if (!currentScene) {
    if (code === 'Space' && home.activeScene) { modeSelect.open(home.activeScene); updatePause(); }
    return;
  }
  if (code === 'Space' && activeFeature?.kind === 'home') { exitToHome(); return; }
  if (code === 'KeyG' && activeFeature?.kind === 'sleep') { recoverSleep(); return; }
  if (code === 'KeyG' && activeFeature?.kind === 'meal') { recoverMeal(); return; }
  if (mode === 'practice' && code === 'KeyF' && activeWord) vocab.focusInput();
  if (mode === 'practice' && code === 'KeyR' && practiceRound?.mistakeInRound) switchSceneToStudy();
  if (mode === 'study' && activeWord && code === 'KeyQ') speakWord(activeWord.word, 'us');
  if (mode === 'study' && activeWord && code === 'KeyE') speakWord(activeWord.word, 'uk');
}

function switchSceneToStudy() {
  mode = 'study';
  sceneRenderer?.setMode('study');
  save.location.mode = 'study';
  saveManager.save(save);
  const word = activeWord;
  practiceRound = null;
  if (word) vocab.showStudy(word, save.wordStates, isPlaceholder(word));
  hud.render(save, currentScene, mode);
  showNotice('整个场景已切换为学习模式', 'gold');
}

function renderScenePrompt() {
  let content = '';
  if (activeFeature?.kind === 'home') content = '<kbd>Space</kbd><span>返回 HOME</span>';
  else if (activeFeature?.kind === 'sleep') content = '<kbd>G</kbd><span>在床边休息</span>';
  else if (activeFeature?.kind === 'meal') content = '<kbd>G</kbd><span>在餐点用餐</span>';
  else if (mode === 'practice' && activeWord) content = '<kbd>F</kbd><span>开始 / 继续拼写</span>';
  else if (!canStartLearning(save)) content = `<span>${needsMessage()}</span>`;
  elements.prompt.hidden = !content;
  elements.prompt.innerHTML = content;
}

async function recoverSleep() {
  recoveryBusy = true;
  elements.recovery.hidden = false;
  elements.recovery.innerHTML = '<div class="recovery-overlay sleep"><span>月光收起今天的脚步</span><strong>Z z z</strong></div>';
  updatePause();
  await delay(1300);
  save.worldMinute = nextWakeMinute(save.worldMinute);
  save.lastSleepMinute = save.worldMinute;
  save.needsSleep = false;
  saveManager.save(save);
  elements.recovery.hidden = true;
  elements.recovery.replaceChildren();
  recoveryBusy = false;
  hud.render(save, currentScene, mode);
  updatePause();
  showNotice('早安 · 精力恢复到 100%', 'success');
  if (!activeWord) changeActiveWord(nearestWord(layout, scenePlayer));
}

async function recoverMeal() {
  recoveryBusy = true;
  elements.recovery.hidden = false;
  elements.recovery.innerHTML = '<div class="recovery-overlay meal"><span>一顿温暖的饭，让灯光重新明亮</span><strong>♨</strong></div>';
  updatePause();
  await delay(900);
  save.lastMealMinute = save.worldMinute;
  saveManager.save(save);
  elements.recovery.hidden = true;
  elements.recovery.replaceChildren();
  recoveryBusy = false;
  hud.render(save, currentScene, mode);
  updatePause();
  showNotice('饥饿恢复到 100%', 'success');
  if (!activeWord) changeActiveWord(nearestWord(layout, scenePlayer));
}

function needsMessage() {
  const messages = [];
  if (fatigue(save.worldMinute, save.lastSleepMinute, save.needsSleep) <= 0) messages.push('精力耗尽：去 Master Bedroom 找床，按 G 休息');
  if (hunger(save.worldMinute, save.lastMealMinute) <= 0) messages.push('饥饿：前往 Kitchen / Diningroom 的餐点，按 G 用餐');
  return messages.join('；');
}

function checkCompletion() {
  const stats = scoreWorld(worldData.scenes, save.wordStates);
  if (stats.complete && !save.completionShown) {
    completion.open(stats, worldData.scenes.length);
    updatePause();
  }
}

function continueWorld() {
  save.completionShown = true;
  saveManager.save(save);
  completion.close();
  updatePause();
}

function resetWorld() {
  if (!window.confirm('确定新开世界吗？这会清除 HOME ATLAS 的唯一存档，但不会影响其他网页数据。')) return;
  if (!window.confirm('当前词汇状态、时间和角色位置将无法恢复。再次确认新开世界？')) return;
  saveManager.reset();
  window.location.reload();
}

function toggleHelp() {
  if (help.isOpen) help.close(); else help.open();
  updatePause();
}

function updatePause() {
  overlayPaused = !document.querySelector('#onboarding-root').hidden || modeSelect.isOpen || help.isOpen || !document.querySelector('#completion-root').hidden || recoveryBusy;
  clock.setPaused(overlayPaused);
  if (overlayPaused) input.clear();
}

function isGamePaused() { return overlayPaused || document.hidden || !document.hasFocus() || InputManager.isEditable(); }

function persistPosition() {
  if (currentScene) state.setLocation({ sceneId: currentScene.id, x: scenePlayer.x, z: scenePlayer.z, mode, coordinateSpace: 'scene-world' });
  else state.setLocation({ sceneId: 'home', x: homePlayer.x, z: homePlayer.z, mode: null, coordinateSpace: 'home-normalized' });
}

function resize() {
  home.resize();
  sceneRenderer?.resize();
  miniMap.draw();
}

function showNotice(message, type = 'info') {
  const stack = document.querySelector('#notice-stack');
  if (!stack) return;
  const notice = document.createElement('div');
  notice.className = `notice notice-${type}`;
  notice.textContent = message;
  stack.append(notice);
  setTimeout(() => notice.remove(), 2600);
}

function speakWord(word, accent) {
  if (mode !== 'study' || !activeWord || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.toLowerCase())) || null;
  utterance.rate = 0.86;
  speechSynthesis.speak(utterance);
  showNotice(`${accent === 'uk' ? 'UK' : 'US'} · 浏览器 TTS 合成发音`, 'info');
}

function playSound(url, volume) {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function isPlaceholder(word) {
  const relative = word.image.replace(/^\/assets\/items\//, '');
  return placeholderPaths.has(relative);
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = url;
  });
}
