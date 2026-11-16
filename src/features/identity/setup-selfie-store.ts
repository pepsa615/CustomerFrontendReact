let pendingSelfie: File | null = null;

export function setPendingSelfie(file: File | null) {
  pendingSelfie = file;
}

export function takePendingSelfie() {
  const file = pendingSelfie;
  pendingSelfie = null;
  return file;
}

export function peekPendingSelfie() {
  return pendingSelfie;
}