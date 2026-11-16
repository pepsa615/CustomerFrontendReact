const INTRO_KEY = 'pepsa.intro-complete';

export function hasCompletedIntro() {
  return localStorage.getItem(INTRO_KEY) === 'true';
}

export function markIntroComplete() {
  localStorage.setItem(INTRO_KEY, 'true');
}